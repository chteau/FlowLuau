# Node Authoring Guidelines

These rules define the exact structure every node file must follow. There are no exceptions. When in doubt, copy the structure of an existing node and change only the content — not the shape.

---

## 1. File-level directives & imports

### 1.1 Directive
Every node file **must** begin with the `"use client"` directive on its own line, followed by a blank line.

```tsx
"use client";

import …
```

### 1.2 Import order
Imports must appear in this exact order, each group separated by a blank line:

1. **React / React hooks** — only import what you actually use. Never import `React` as a namespace; import named hooks directly.
2. **`@xyflow/react`** — `NodeProps`, React Flow hooks (`useNodeId`, `useReactFlow`, `useStore`), etc.
3. **`NodeTemplate`** — always a relative path to `./Template` or `../../Template` depending on depth.
4. **Lucide icons** — only the icons used in this file.
5. **Internal utilities** — `cn` from `@/lib/utils`.
6. **shadcn/ui components** — `Input`, `Button`, `Select`, etc.
7. **Project types** — `LuauType` from `@/types/luau`.
8. **Project components** — `VariableAutocomplete`, etc.
9. **Project stores** — `useIntellisenseStore`, etc.

```tsx
// ✅ Correct
import { memo, useCallback, useState } from "react";
import { NodeProps, useNodeId, useReactFlow } from "@xyflow/react";
import NodeTemplate from "../../Template";
import { Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LuauType } from "@/types/luau";

// ❌ Wrong — namespace import, wrong order, unused imports
import React, { memo } from "react";
import { LuauType } from "@/types/luau";
import { NodeProps } from "@xyflow/react";
import { Input, Button } from "@/components/ui/input";
import NodeTemplate from "../../Template";
```

---

## 2. Section separators

Files with more than one logical section **must** use banner comments to separate them. Use this exact format (72-character dashes):

```tsx
// ─── Section name ────────────────────────────────────────────────────────────
```

The required sections, in order, are:

1. `Local types` — file-private interfaces/types (omit section if none)
2. `Node data & props` — the exported `*NodeData` interface and `*NodeProps` type
3. `Component` — the `memo(…)` component and `displayName`
4. `Static handle configuration` — the `.getHandles` assignment

---

## 3. Local types

If the node requires helper types used only within the file (e.g. `TableEntry`), define them **before** the exported types and mark them with a short single-line JSDoc comment. Do not export them unless another file imports them.

```tsx
// ─── Local types ─────────────────────────────────────────────────────────────

/** A single key-value entry in a literal-mode Luau table. */
interface TableEntry {
    key: string;
    value: string | number | boolean;
}
```

Do **not** define interfaces for `getHandles` return types or `HandleConfig` shapes locally — these are not needed and add noise.

---

## 4. Node data interface

### 4.1 Naming
The interface must be named `<NodeName>NodeData` and **exported**.

### 4.2 Contents
- Declare only the fields that this specific node actually reads or writes.
- If the node reads `__scriptId` from its data (injected by the editor), include `__scriptId?: string` as the **last** field.
- All fields are **optional** (`?`) unless they are structurally required for the component to render at all.
- Use concrete types — never `any`, never `Record<string, any>`.

```tsx
// ✅ Correct
export interface AddNodeData {
    mode?: "linear" | "expression";
    expression?: string;
}

// ✅ Correct — node that reads __scriptId
export interface NumberNodeData {
    mode?: "literal" | "expression";
    value?: number;
    expression?: string;
    __scriptId?: string;
}

// ❌ Wrong — data: Record<string, any> is forbidden
export interface StartNodeData {
    data: Record<string, any>;
}
```

### 4.3 JSDoc
The data interface gets **no** JSDoc block. Its fields are self-documenting through their names and types. Add an inline comment only if a field's purpose is truly non-obvious.

---

## 5. Props type

### 5.1 Naming
The type must be named `<NodeName>NodeProps` and **exported**.

### 5.2 Shape
Always intersect `NodeProps` with `{ data: <NodeName>NodeData }`. Never use `Partial<>` here.

```tsx
// ✅ Correct
export type AddNodeProps = NodeProps & { data: AddNodeData };

// ❌ Wrong — Partial loses type safety
export type AddNodeProps = NodeProps & Partial<AddNodeData>;

// ❌ Wrong — bare NodeProps gives data: unknown
export type AddNodeProps = NodeProps;
```

### 5.3 JSDoc
The props type gets **no** JSDoc block.

---

## 6. Component

### 6.1 Definition
Always use `memo`. Always assign to a `const` with the `<NodeName>Node` name. Never use function declarations.

```tsx
// ✅ Correct
const AddNode = memo(({ data, selected }: AddNodeProps) => { … });

// ❌ Wrong — function declaration
function AddNode({ data, selected }: AddNodeProps) { … }

// ❌ Wrong — missing memo
const AddNode = ({ data, selected }: AddNodeProps) => { … };
```

### 6.2 Destructured props
Destructure **only** `data` and `selected` from props. Never destructure `isConnectable`, `dragging`, `id`, or any other React Flow prop unless the component body actually uses them.

```tsx
// ✅ Correct
const PrintNode = memo(({ data, selected }: PrintNodeProps) => (…));

// ❌ Wrong — isConnectable and dragging are never used
const PrintNode = memo(({ data, isConnectable, selected, dragging }: PrintNodeProps) => (…));
```

### 6.3 Reading from `data`
Always use the nullish coalescing operator (`??`) to provide defaults — never `||`. The `||` operator suppresses falsy values like `0` and `false`, which are valid Luau values.

```tsx
// ✅ Correct
const [mode, setMode] = useState<"literal" | "expression">(data.mode ?? "literal");
const [value, setValue] = useState(data.value ?? 0);

// ❌ Wrong — || would turn 0 into "0" or a default
const [mode, setMode] = useState(data.mode || "literal");
const [value, setValue] = useState(data.value || 0);
```

### 6.4 State initialization
Initialize all local state directly from `data` in the `useState` calls. Do not derive state in a `useEffect` on mount — only use `useEffect` to sync with **subsequent external changes** (e.g. undo/redo), and only when the component explicitly manages externally-driven data (like `TableNode`'s entries).

### 6.5 `updateData` pattern (nodes that persist state to React Flow)
If the node must write changes back to the React Flow store, define a single `updateData` callback that merges a partial object. Name it `updateData`. Place it directly after state declarations.

```tsx
const updateData = useCallback(
    (partial: Partial<AddNodeData>) => {
        setNodes((nodes) =>
            nodes.map((n) =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...partial } } : n
            )
        );
    },
    [nodeId, setNodes]
);
```

### 6.6 Event handlers
- Name handlers `handle<Thing><Event>`: `handleModeChange`, `handleExpressionChange`, `handleBlur`.
- Always `useCallback` for handlers that are passed to child elements or that call `updateData`.
- Inline `setMode` directly in the `onClick` prop when the handler does nothing else: `onClick={() => setMode("literal")}`.

```tsx
// ✅ Correct — simple toggle, inline is fine
onClick={() => setMode("literal")}

// ✅ Correct — has side effects, needs useCallback
const handleModeChange = useCallback((newMode: "linear" | "expression") => {
    setMode(newMode);
    updateData({ mode: newMode });
}, [updateData]);

// ❌ Wrong — unnecessary named function for a one-liner
const handleModeChange = (newMode: string) => { setMode(newMode); };
```

### 6.7 `scriptId` access
Read `__scriptId` directly from `data` without a cast:

```tsx
// ✅ Correct — __scriptId is typed as string | undefined in the interface
const scriptId = data.__scriptId;

// ❌ Wrong — unnecessary cast
const scriptId = data?.__scriptId as string | undefined;
```

### 6.8 JSDoc
Each component gets **one** concise JSDoc comment immediately above the `const` declaration. The format is:

```
/** One sentence saying what value/operation this node represents.
 *  One sentence on modes if applicable. One sentence on handle shape. */
```

Maximum 3 sentences. No `@param`, no `@example`, no `@component` tag, no bullet lists.

```tsx
// ✅ Correct
/**
 * Addition node. Linear mode exposes two Number inputs (A + B).
 * Expression mode evaluates a custom arithmetic expression.
 * Outputs a single Number-typed result.
 */
const AddNode = memo(…);

// ❌ Wrong — novel-length JSDoc with @param, @example, use-case lists, etc.
```

### 6.9 `displayName`
Immediately after the closing `)` of `memo(…)`, set `displayName` on its own line:

```tsx
AddNode.displayName = "AddNode";
```

---

## 7. Static handle configuration

### 7.1 Shape
Every node **must** have a `.getHandles` static method attached after `displayName`. It must be written as a direct property assignment — no intermediate typed wrappers, no `HandleConfig` interface, no double-cast.

```tsx
// ✅ Correct
(AddNode as any).getHandles = (data: AddNodeData) => ({
    inputs:
        (data?.mode ?? "linear") === "linear"
            ? [
                  { id: "a", label: "A", type: LuauType.Number },
                  { id: "b", label: "B", type: LuauType.Number },
              ]
            : [],
    outputs: [{ id: "result", label: "Result", type: LuauType.Number }],
});

// ❌ Wrong — double-cast with local interface
interface HandleConfig { outputs: …[] }
(AddNode as any).getHandles = ((data: AddNodeData): HandleConfig => ({…})) as GetHandlesFunction;
```

### 7.2 Parameter name
- If `data` is read to compute dynamic handles, name the parameter `data: <NodeName>NodeData`.
- If handles are always static (no data needed), prefix with `_` to mark it intentionally unused: `_data: <NodeName>NodeData`.

```tsx
// ✅ Correct — dynamic (arithmetic nodes in expression mode)
(AddNode as any).getHandles = (data: AddNodeData) => ({…});

// ✅ Correct — static (Print, Nil, Start, End)
(PrintNode as any).getHandles = (_data: PrintNodeData) => ({…});
```

### 7.3 Always include both keys
`getHandles` must always return an object with **both** `inputs` and `outputs`, even when one of them is an empty array.

```tsx
// ✅ Correct — even pure sources have inputs: []
(NilNode as any).getHandles = (_data: NilNodeData) => ({
    inputs: [],
    outputs: [{ id: "output", label: "Value", type: LuauType.Nil }],
});

// ❌ Wrong — missing inputs key
(NilNode as any).getHandles = (_data: NilNodeData) => ({
    outputs: [{ id: "output", label: "Value", type: LuauType.Nil }],
});
```

### 7.4 Handle objects
Every handle object in both `inputs` and `outputs` must have exactly three fields in this order: `id`, `label`, `type`. All three are required. Use the same `id` and `label` values as those passed to `NodeTemplate` in the component.

```tsx
{ id: "result", label: "Result", type: LuauType.Number }
```

### 7.5 Handle types must match the component
The handle types in `getHandles` must be **identical** to those rendered in `NodeTemplate`. If the component renders `LuauType.Flow`, `getHandles` must also return `LuauType.Flow`.

---

## 8. Export

The **only** export statement in the file is the default export, as the last line:

```tsx
export default AddNode;
```

The `*NodeData` interface and `*NodeProps` type are named exports declared inline with `export interface` / `export type`. No barrel re-exports inside node files.

---

## 9. Complete file skeleton

Copy this skeleton exactly when creating a new node. Replace every `<…>` placeholder.

```tsx
"use client";

import { memo } from "react";                          // add hooks as needed
import { NodeProps } from "@xyflow/react";             // add RF hooks as needed
import NodeTemplate from "../../Template";             // adjust depth as needed
import { <Icon> } from "lucide-react";
import { LuauType } from "@/types/luau";

// (omit this section entirely if there are no file-private types)
/** Description of what this type represents. */
interface <LocalType> {
    …
}

export interface <Name>NodeData {
    field?: <Type>;
    // …
    __scriptId?: string;  // only if this node reads __scriptId
}

export type <Name>NodeProps = NodeProps & { data: <Name>NodeData };

/** A simple description of the node's handle, explaining what it does. **/
const <Name>Node = memo(({ data, selected }: <Name>NodeProps) => {
    // State
    const [field, setField] = useState<Type>(data.field ?? <default>);

    // Handlers
    const handleChange = useCallback(…, […]);

    return (
        <NodeTemplate
            details={{
                color: {
                    background: "bg-<color>-400/10",
                    border: "border-<color>-400/30",
                    text: "text-<color>-400",
                    ring: "ring-<color>-400/40",
                },
                icon: <Icon>,
                name: "<Display Name>",
                description: "…",
                selected,
            }}
            inputs={[…]}   // omit prop entirely if no inputs
            outputs={[…]}  // omit prop entirely if no outputs
        >
            {/* children only if the node has UI controls */}
        </NodeTemplate>
    );
});

<Name>Node.displayName = "<Name>Node";

(<Name>Node as any).getHandles = (_data: <Name>NodeData) => ({
    inputs: […],
    outputs: […],
});

export default <Name>Node;
```

---

## 10. Color palette

Use these pre-defined color sets.

| Category | `background` | `border` | `text` | `ring` |
|---|---|---|---|---|
| Primitive types (Nil, Number, String, Boolean, Table) | `bg-amber-400/10` | `border-amber-400/30` | `text-amber-400` | `ring-amber-400/40` |
| Arithmetic (Add, Subtract, Multiply, Divide, Modulus) | `bg-green-400/10` | `border-green-400/30` | `text-green-400` | `ring-green-400/40` |
| Variables (Get, Set) | `bg-red-400/10` | `border-red-400/30` | `text-red-400` | `ring-red-400/40` |
| Functions (Definition, Call) | `bg-pink-400/10` | `border-pink-400/30` | `text-pink-400` | `ring-pink-400/40` |
| Side effects (Print, …) | `bg-blue-400/10` | `border-blue-400/30` | `text-blue-400` | `ring-blue-400/40` |
| Control flow (If, Loop, Break, …) | `bg-purple-400/10` | `border-purple-400/30` | `text-purple-400` | `ring-purple-400/40` |
| Root nodes (Start, End) | none — omit the `color` key entirely |

> For new nodes category you may choose new colors from the tailwindcss palette.

---

## 11. Handle `id` and `label` conventions

| Role | `id` | `label` |
|---|---|---|
| Execution flow input | `"prev"` | `"Prev"` |
| Execution flow output | `"next"` | `"Next"` |
| Single data output (primitives) | `"output"` | `"Value"` |
| Single data result (arithmetic) | `"result"` | `"Result"` |
| Arithmetic operand A | `"a"` | `"A"` |
| Arithmetic operand B | `"b"` | `"B"` |
| Generic value input | `"value"` | `"Value"` |
| Function parameter N (0-indexed) | `"param-N"` | parameter name |
| Function return value | `"result"` | `"Result"` |

---

## 12. Things that are explicitly forbidden

- `React` namespace import (`import React from "react"` / `import React, { … }`)
- `Partial<XNodeData>` in the props type
- Unused destructured props (`isConnectable`, `dragging`, `id`, …)
- `||` for default values on data fields (use `??`)
- `.meta` on the component (use `.getHandles`)
- Novel-length JSDoc with `@param`, `@example`, `@component`, `@typedef`, `@returns`
- Locally-defined `HandleConfig`, `GetHandlesFunction`, or any interface scoped to the `.getHandles` call
- Double-cast pattern: `((data) => ({…})) as SomeType`
- `as string | undefined` casts on `data.__scriptId` — it is already typed
- `data?.__scriptId` optional chaining — `data` is never undefined; use `data.__scriptId`
- Missing `inputs` or `outputs` key in the `getHandles` return value
- Mismatched handle types between the component render and `getHandles`
- `export default` anywhere other than the last line of the file