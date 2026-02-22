"use client";

import React, {
    useRef,
    useState,
    useEffect,
    useCallback,
    KeyboardEvent,
    MouseEvent,
    forwardRef,
    useImperativeHandle,
} from "react";
import { useIntellisenseStore, Variable } from "@/stores/intellisense-store";
import { useShallow } from "zustand/shallow";
import { LuauType } from "@/types/luau";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "./input";

/**
 * Props interface for VariableAutocomplete component
 *
 * Provides context-aware variable suggestions scoped to a specific script ID
 * with optional filtering and customization capabilities.
 *
 * @interface
 * @property {string} scriptId - Required script identifier for variable scoping
 *   Ensures isolation between different scripts in multi-script environments
 * @property {(variable: Variable) => boolean} [filterVariables] - Optional predicate function
 *   Filters which variables appear in suggestions (e.g., by type compatibility)
 * @property {(variable: Variable) => React.ReactNode} [renderVariable] - Custom renderer
 *   Overrides default variable display with custom JSX representation
 * @property {(variable: Variable) => void} [onVariableSelect] - Selection callback
 *   Triggered when user selects a variable from suggestions
 * @property {string} [wrapperClassName] - Custom class for root container element
 * @property {string} [dropdownClassName] - Custom class for suggestions dropdown
 * @property {string} [placeholder] - Input placeholder text (default: "Type expression...")
 */
export interface VariableAutocompleteProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    scriptId: string;
    filterVariables?: (variable: Variable) => boolean;
    renderVariable?: (variable: Variable) => React.ReactNode;
    onVariableSelect?: (variable: Variable) => void;
    wrapperClassName?: string;
    dropdownClassName?: string;
}

/**
 * Imperative handle interface for VariableAutocomplete component
 *
 * Exposes programmatic control methods via React ref for advanced integration scenarios.
 *
 * @interface
 * @property {() => void} focus - Programmatically focuses the input field
 * @property {() => void} blur - Programmatically blurs the input field
 * @property {() => string} getValue - Retrieves current input value
 * @property {(value: string) => void} setValue - Sets input value programmatically
 *   Triggers synthetic input event to maintain React state synchronization
 */
export interface VariableAutocompleteRef {
    focus: () => void;
    blur: () => void;
    getValue: () => string;
    setValue: (value: string) => void;
}

/**
 * VariableAutocomplete component provides intelligent variable suggestions for Luau expressions
 *
 * Features context-aware autocomplete scoped to script boundaries with type-aware filtering.
 * Integrates seamlessly with variable registry for real-time suggestions as users type
 * variable names within expressions.
 *
 * Core capabilities:
 * - Script-scoped variable isolation (prevents cross-script leakage)
 * - Word-boundary detection for intelligent suggestion triggering
 * - Keyboard navigation (Arrow keys, Enter, Tab, Escape)
 * - Type-aware badge display for each variable suggestion
 * - Whitespace-aware insertion preserving expression syntax
 * - Imperative handle API for programmatic control
 * - Customizable filtering and rendering
 *
 * Suggestion behavior:
 * - Activates automatically when typing valid Luau identifier characters ([a-zA-Z_])
 * - Filters based on current partial word at cursor position (not entire input)
 * - Shows type badges using semantic color coding (Number=blue, String=amber, Boolean=purple)
 * - Inserts variables with intelligent whitespace handling:
 *   - Adds space before if preceding character isn't operator/whitespace
 *   - Adds space after if following character isn't operator/whitespace
 * - Maintains cursor position after insertion for fluid typing experience
 *
 * Integration notes:
 * - Requires scriptId prop for proper variable scoping
 * - Works best with monospace font (font-mono) for expression editing
 * - Compatible with React Hook Form and other controlled input libraries
 * - Uses useShallow selector to prevent unnecessary re-renders on registry changes
 *
 * Performance characteristics:
 * - O(n) filtering complexity where n = variables in script scope (typically < 100)
 * - Debounced suggestion updates via cursor position tracking
 * - Memoized callbacks to prevent child component re-renders
 * - Efficient cleanup of event listeners on unmount
 *
 * @component
 * @param {VariableAutocompleteProps} props - Component properties
 * @param {React.Ref<VariableAutocompleteRef>} ref - Imperative handle ref
 *
 * @example
 * // Basic usage with script context
 * <VariableAutocomplete
 *   scriptId={currentScript.id}
 *   value={expression}
 *   onChange={(e) => setExpression(e.target.value)}
 *   placeholder="e.g., score * multiplier"
 * />
 *
 * @example
 * // Type-filtered suggestions (only Number variables)
 * <VariableAutocomplete
 *   scriptId={scriptId}
 *   filterVariables={(v) => v.type === LuauType.Number}
 *   value={expression}
 *   onChange={handleChange}
 * />
 *
 * @example
 * // Programmatic control via ref
 * const autocompleteRef = useRef<VariableAutocompleteRef>(null);
 *
 * const insertScoreVariable = () => {
 *   autocompleteRef.current?.setValue("score");
 *   autocompleteRef.current?.focus();
 * };
 *
 * <VariableAutocomplete ref={autocompleteRef} scriptId={scriptId} />
 * <Button onClick={insertScoreVariable}>Insert Score</Button>
 */
const VariableAutocomplete = forwardRef<
    VariableAutocompleteRef,
    VariableAutocompleteProps
>(
    (
        {
            scriptId,
            filterVariables,
            renderVariable,
            onVariableSelect,
            wrapperClassName,
            dropdownClassName,
            className,
            value,
            onChange,
            onKeyDown,
            onBlur,
            onFocus,
            placeholder = "Type expression...",
            ...props
        },
        ref
    ) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const dropdownRef = useRef<HTMLDivElement>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [highlightedIndex, setHighlightedIndex] = useState(0);
        const [cursorPosition, setCursorPosition] = useState(0);
        const [activePartialWord, setActivePartialWord] = useState("");

        const valueRef = useRef(value);
        useEffect(() => {
            valueRef.current = value;
        }, [value]);

        /**
         * Retrieves script-scoped variables from centralized registry
         *
         * Uses useShallow selector to prevent unnecessary re-renders when unrelated
         * variables change in other scripts. Returns empty array when script context
         * is invalid or no variables registered.
         *
         * @returns {Variable[]} Array of variable definitions for current script scope
         * @dependency {string} scriptId - Current script identifier for registry lookup
         */
        const variables = useIntellisenseStore(
            useShallow((s) => s.getVariablesForScript(scriptId))
        );

        /**
         * Extracts partial variable name at current cursor position
         *
         * Implements Luau identifier parsing rules to detect the current word being typed:
         * - Matches alphanumeric characters and underscores ([\w_]*)
         * - Captures only the fragment before cursor within current word boundary
         * - Returns empty string when cursor not within valid identifier context
         *
         * @param {string} text - Current input value
         * @param {number} pos - Cursor position within text
         * @returns {string} Partial identifier fragment at cursor position
         *
         * @example
         * getPartialWordAtCursor("score + bon", 11) // returns "bon"
         * getPartialWordAtCursor("health > 50", 7)  // returns ""
         */
        const getPartialWordAtCursor = useCallback(
            (text: string, pos: number): string => {
                const beforeCursor = text.slice(0, pos);
                const match = beforeCursor.match(/[\w_]*$/);
                return match ? match[0] : "";
            },
            []
        );

        /**
         * Updates active partial word based on cursor position and input value
         *
         * Tracks the current identifier fragment being typed to enable context-aware
         * suggestion filtering. Only activates suggestions when typing valid Luau
         * identifier starters ([a-zA-Z_]).
         *
         * @effect
         * @dependency {string | number} value - Current input content
         * @dependency {number} cursorPosition - Current cursor location
         */
        useEffect(() => {
            if (value !== undefined) {
                const partial = getPartialWordAtCursor(String(value), cursorPosition);
                setActivePartialWord(partial);
            } else {
                setActivePartialWord("");
            }
        }, [value, cursorPosition, getPartialWordAtCursor]);

        /**
         * Filters available variables based on current partial word context
         *
         * Applies optional custom filter first, then matches against partial word using
         * case-insensitive prefix/substring matching. Only suggests when typing valid
         * Luau identifier starters.
         *
         * @computed
         * @returns {Variable[]} Filtered subset of script variables matching current context
         */
        const filteredVariables = variables.filter((v) => {
            if (filterVariables && !filterVariables(v)) return false;
            if (!/^[a-zA-Z_]/.test(activePartialWord)) return false;

            const varNameLower = v.name.toLowerCase();
            const partialLower = activePartialWord.toLowerCase();
            return varNameLower.startsWith(partialLower) || varNameLower.includes(partialLower);
        });

        /**
         * Handles input change events with cursor tracking and suggestion activation
         *
         * Updates cursor position on every keystroke and intelligently toggles suggestion
         * dropdown based on whether user is typing a valid variable identifier fragment.
         *
         * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
         * @sideEffect Updates cursor position state and suggestion visibility
         */
        const handleInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const newPos = e.target.selectionStart || 0;
                setCursorPosition(newPos);

                const partial = getPartialWordAtCursor(e.target.value, newPos);
                if (partial.length > 0 && /^[a-zA-Z_]/.test(partial)) {
                    setIsOpen(true);
                } else if (partial.length === 0) {
                    setIsOpen(false);
                }

                onChange?.(e);
            },
            [onChange, getPartialWordAtCursor]
        );

        /**
         * Inserts selected variable into input at current cursor position
         *
         * Implements intelligent whitespace handling to preserve expression syntax:
         * - Adds leading space if preceding character isn't operator/whitespace
         * - Adds trailing space if following character isn't operator/whitespace
         * - Maintains cursor position after insertion for fluid typing continuation
         * - Dispatches synthetic input event for React state synchronization
         *
         * @param {Variable} variable - Selected variable to insert
         * @sideEffect Updates input value and cursor position
         */
        const handleSelectVariable = useCallback(
            (variable: Variable) => {
                if (!inputRef.current || valueRef.current === undefined) return;

                const currentText = String(valueRef.current);
                const varName = variable.name;
                const partialWord = getPartialWordAtCursor(currentText, cursorPosition);
                const startIdx = cursorPosition - partialWord.length;
                const endIdx = cursorPosition;

                const charBefore = currentText[startIdx - 1] || "";
                const charAfter = currentText[endIdx] || "";

                const needsSpaceBefore =
                    startIdx > 0 &&
                    !/[\s+\-*/%()=<>!&|,]/.test(charBefore) &&
                    charBefore !== "";

                const needsSpaceAfter =
                    endIdx < currentText.length &&
                    !/[\s+\-*/%()=<>!&|,]/.test(charAfter) &&
                    charAfter !== "";

                const newText =
                    currentText.slice(0, startIdx) +
                    (needsSpaceBefore ? " " : "") +
                    varName +
                    (needsSpaceAfter ? " " : "") +
                    currentText.slice(endIdx);

                const newCursorPos =
                    startIdx +
                    (needsSpaceBefore ? 1 : 0) +
                    varName.length +
                    (needsSpaceAfter ? 1 : 0);

                const input = inputRef.current;
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    "value"
                )?.set;
                nativeInputValueSetter?.call(input, newText);
                input.dispatchEvent(new Event("input", { bubbles: true }));

                setTimeout(() => {
                    input.setSelectionRange(newCursorPos, newCursorPos);
                    input.focus();
                }, 0);

                onVariableSelect?.(variable);
                setIsOpen(true);
                setHighlightedIndex(0);
                setCursorPosition(newCursorPos);
            },
            [cursorPosition, onVariableSelect, getPartialWordAtCursor]
        );

        /**
         * Handles keyboard navigation within suggestion dropdown
         *
         * Supports standard navigation patterns:
         * - ArrowDown/ArrowUp: Cycle through suggestions
         * - Enter/Tab: Accept highlighted suggestion
         * - Escape: Close dropdown without selection
         * - Passes through other keys to parent handlers
         *
         * @param {KeyboardEvent<HTMLInputElement>} e - Keyboard event
         * @sideEffect Updates highlighted index and/or inserts variable
         */
        const handleInputKeyDown = useCallback(
            (e: KeyboardEvent<HTMLInputElement>) => {
                if (!isOpen) {
                    if (e.key === "Tab" && filteredVariables.length > 0) {
                        e.preventDefault();
                        handleSelectVariable(filteredVariables[0]!);
                        return;
                    }
                    onKeyDown?.(e);
                    return;
                }

                switch (e.key) {
                    case "ArrowDown":
                        e.preventDefault();
                        setHighlightedIndex((prev) =>
                            prev < filteredVariables.length - 1 ? prev + 1 : prev
                        );
                        break;
                    case "ArrowUp":
                        e.preventDefault();
                        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                        break;
                    case "Enter":
                        e.preventDefault();
                        if (filteredVariables[highlightedIndex]) {
                            handleSelectVariable(filteredVariables[highlightedIndex]);
                        } else {
                            setIsOpen(false);
                        }
                        break;
                    case "Escape":
                        e.preventDefault();
                        setIsOpen(false);
                        break;
                    case "Tab":
                        e.preventDefault();
                        if (filteredVariables[highlightedIndex]) {
                            handleSelectVariable(filteredVariables[highlightedIndex]);
                        } else {
                            setIsOpen(false);
                        }
                        break;
                    default:
                        onKeyDown?.(e);
                }
            },
            [
                isOpen,
                onKeyDown,
                filteredVariables,
                highlightedIndex,
                handleSelectVariable,
            ]
        );

        /**
         * Handles input focus with contextual suggestion activation
         *
         * Shows dropdown on focus only when cursor is within a valid variable name context
         * to avoid unnecessary UI noise during normal navigation.
         *
         * @param {React.FocusEvent<HTMLInputElement>} e - Focus event
         * @sideEffect May open suggestion dropdown based on cursor context
         */
        const handleInputFocus = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                const partial = getPartialWordAtCursor(String(value || ""), cursorPosition);
                setIsOpen(variables.length > 0 && partial.length > 0 && /^[a-zA-Z_]/.test(partial));
                onFocus?.(e);
            },
            [onFocus, variables.length, value, cursorPosition, getPartialWordAtCursor]
        );

        /**
         * Handles input blur with delayed dropdown dismissal
         *
         * Prevents premature dropdown closure when clicking inside dropdown elements
         * by delaying dismissal and checking active element context.
         *
         * @param {React.FocusEvent<HTMLInputElement>} e - Blur event
         * @sideEffect Closes dropdown after brief delay if focus moved outside component
         */
        const handleInputBlur = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                const timer = setTimeout(() => {
                    if (
                        !dropdownRef.current?.contains(document.activeElement as Node) &&
                        !inputRef.current?.contains(document.activeElement as Node)
                    ) {
                        setIsOpen(false);
                    }
                }, 200);

                onBlur?.(e);
                return () => clearTimeout(timer);
            },
            [onBlur]
        );

        /**
         * Closes dropdown when clicking outside component boundaries
         *
         * Listens for mousedown events on document to detect outside clicks while
         * dropdown is open, closing dropdown when click occurs outside both input
         * and dropdown containers.
         *
         * @effect
         * @dependency {boolean} isOpen - Dropdown visibility state
         */
        useEffect(() => {
            const handleClickOutside = (e: globalThis.MouseEvent) => {
                const target = e.target as Node;
                const isOutsideInput = !inputRef.current?.contains(target);
                const isOutsideDropdown = !dropdownRef.current?.contains(target);

                if (isOutsideInput && isOutsideDropdown) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener("mousedown", handleClickOutside);
            }

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [isOpen]);

        /**
         * Exposes imperative methods via ref for parent component control
         *
         * Enables programmatic focus management, value retrieval, and updates
         * from parent components without breaking controlled input patterns.
         *
         * @ref
         */
        useImperativeHandle(ref, () => ({
            focus: () => inputRef.current?.focus(),
            blur: () => inputRef.current?.blur(),
            getValue: () => inputRef.current?.value || "",
            setValue: (val: string) => {
                if (inputRef.current) {
                    inputRef.current.value = val;
                    inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
                }
            },
        }));

        /**
         * Prevents dropdown dismissal when clicking on dropdown items
         *
         * Stops event propagation on mousedown to prevent blur events from firing
         * when interacting with suggestion items, enabling smooth selection flow.
         *
         * @param {MouseEvent<HTMLDivElement>} e - Mouse down event on dropdown
         */
        const handleDropdownMouseDown = useCallback(
            (e: MouseEvent<HTMLDivElement>) => {
                e.preventDefault();
            },
            []
        );

        return (
            <div className={cn("relative w-full", wrapperClassName)}>
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={placeholder}
                    className={cn(
                        "flex h-7 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 font-mono",
                        className
                    )}
                    {...props}
                />

                {/* Dropdown */}
                {isOpen && filteredVariables.length > 0 && (
                    <div
                        ref={dropdownRef}
                        onMouseDown={handleDropdownMouseDown}
                        className={cn(
                            "absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                            dropdownClassName
                        )}
                        style={{ minWidth: inputRef.current?.offsetWidth }}
                    >
                        {filteredVariables.map((variable, index) => (
                            <div
                                key={variable.name}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelectVariable(variable);
                                }}
                                className={cn(
                                    "flex items-center justify-between px-2 py-1.5 text-xs rounded cursor-pointer",
                                    index === highlightedIndex
                                        ? "bg-accent text-accent-foreground"
                                        : "hover:bg-accent/50"
                                )}
                            >
                                {renderVariable ? (
                                    renderVariable(variable)
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono">{variable.name}</span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5",
                                                variable.type === LuauType.Number &&
                                                "text-blue-400 border-blue-400/30",
                                                variable.type === LuauType.String &&
                                                "text-amber-400 border-amber-400/30",
                                                variable.type === LuauType.Boolean &&
                                                "text-purple-400 border-purple-400/30",
                                                variable.type === LuauType.Any &&
                                                "text-muted-foreground border-muted"
                                            )}
                                        >
                                            {variable.type === LuauType.Number && "Number"}
                                            {variable.type === LuauType.String && "String"}
                                            {variable.type === LuauType.Boolean && "Boolean"}
                                            {variable.type === LuauType.Any && "Any"}
                                            {variable.type === LuauType.Flow && "Flow"}
                                        </Badge>
                                    </div>
                                )}
                                {index === highlightedIndex && (
                                    <span className="text-muted-foreground ml-2">⏎</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state - only show when actively typing a variable name */}
                {isOpen &&
                    filteredVariables.length === 0 &&
                    activePartialWord.length > 0 &&
                    /^[a-zA-Z_]/.test(activePartialWord) && (
                        <div
                            className={cn(
                                "absolute z-50 w-full mt-1 p-2 text-xs text-muted-foreground bg-popover border rounded-md shadow-md",
                                dropdownClassName
                            )}
                        >
                            No matching variables
                        </div>
                    )}
            </div>
        );
    }
);

VariableAutocomplete.displayName = "VariableAutocomplete";

/**
 * Custom hook for managing VariableAutocomplete state and imperative actions
 *
 * Provides convenient state management and ref handling for controlled autocomplete
 * components with programmatic variable insertion capabilities.
 *
 * @hook
 * @param {string | undefined | null} scriptId - Script context identifier
 * @param {string} [initialValue=""] - Initial input value
 * @returns {Object} Hook return value
 * @returns {string} returns.value - Current input value state
 * @returns {(value: string) => void} returns.setValue - State updater function
 * @returns {React.RefObject<VariableAutocompleteRef>} returns.autocompleteRef - Component ref
 * @returns {(variableName: string) => void} returns.insertVariable - Inserts variable with spacing
 * @returns {Object} returns.props - Pre-configured props for spread usage
 *
 * @example
 * // Basic hook usage
 * const { value, setValue, autocompleteRef, props } = useVariableAutocomplete(scriptId);
 *
 * <VariableAutocomplete ref={autocompleteRef} {...props} />
 *
 * @example
 * // Programmatic variable insertion
 * const { insertVariable } = useVariableAutocomplete(scriptId);
 *
 * <Button onClick={() => insertVariable("playerScore")}>
 *   Insert Score Variable
 * </Button>
 */
export function useVariableAutocomplete(
    scriptId: string | undefined | null,
    initialValue: string = ""
) {
    const [value, setValue] = useState(initialValue);
    const autocompleteRef = useRef<VariableAutocompleteRef>(null);

    /**
     * Inserts variable name into input with intelligent spacing
     *
     * Appends variable to current value with space separation for expression readability.
     * Focuses input after insertion for continued typing.
     *
     * @param {string} variableName - Variable identifier to insert
     * @sideEffect Updates input value and focuses component
     */
    const insertVariable = useCallback((variableName: string) => {
        if (!autocompleteRef.current) return;
        const current = autocompleteRef.current.getValue();
        const newValue = current ? `${current} ${variableName}` : variableName;
        autocompleteRef.current.setValue(newValue);
        autocompleteRef.current.focus();
    }, []);

    return {
        value,
        setValue,
        autocompleteRef,
        insertVariable,
        props: {
            scriptId: scriptId || "unknown-script",
            value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value),
        } satisfies Partial<VariableAutocompleteProps>,
    };
}

export default VariableAutocomplete;