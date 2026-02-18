/**
 * Node Manifest
 *
 * This file provides a centralized registry of all available node types,
 * organized into logical categories for easy maintenance and discovery.
 *
 * The manifest follows this structure:
 * - Root Nodes (essential starting points)
 * - Basic Types Nodes (core Luau data types)
 * - Control Flow Nodes (conditional and loop structures)
 * - Function Nodes (function-related operations)
 * - Roblox-Specific Nodes (Roblox API integrations)
 *
 * @example
 * // In your ScriptEditor component
 * import { nodeTypes } from '@/components/project/script-editor/nodes/manifest';
 *
 * <ReactFlow
 *   nodeTypes={nodeTypes}
 *   // ...
 * />
 */

// ======================
// ROOT NODES
// ======================
import StartNode from './Start';

// ======================
// BASIC TYPES NODES
// ======================
import NilNode from './Available/BasicTypes/Nil';
import StringNode from './Available/BasicTypes/String';
import NumberNode from './Available/BasicTypes/Number';
import BooleanNode from './Available/BasicTypes/Boolean';
import TableNode from './Available/BasicTypes/Table';
import VectorNode from './Available/BasicTypes/Vector';

// ======================
// CONTROL FLOW NODES
// ======================
// import ConditionNode from './Available/ControlFlow/Condition';
// import LoopNode from './Available/ControlFlow/Loop';
// import SwitchNode from './Available/ControlFlow/Switch';

// ======================
// FUNCTION NODES
// ======================
// import FunctionNode from './Available/Functions/Function';
// import ReturnNode from './Available/Functions/Return';
// import ParameterNode from './Available/Functions/Parameter';

// ======================
// ROBLOX-SPECIFIC NODES
// ======================
// import InstanceNode from './Available/Roblox/Instance';
// import ServiceNode from './Available/Roblox/Service';
// import EventNode from './Available/Roblox/Event';
// import RemoteNode from './Available/Roblox/Remote';

/**
 * Consolidated node types registry
 *
 * Combines all node types from different categories into a single object
 * that can be directly passed to React Flow's nodeTypes prop.
 */
export const nodeTypes = {
    // Root Nodes
    Start: StartNode,

    // Basic Types Nodes
    Nil: NilNode,
    String: StringNode,
    Number: NumberNode,
    Boolean: BooleanNode,
    Table: TableNode,
    Vector: VectorNode,

    // Control Flow Nodes
    // Condition: ConditionNode,
    // Loop: LoopNode,
    // Switch: SwitchNode,

    // Function Nodes
    // Function: FunctionNode,
    // Return: ReturnNode,
    // Parameter: ParameterNode,

    // Roblox-Specific Nodes
    // Instance: InstanceNode,
    // Service: ServiceNode,
    // Event: EventNode,
    // Remote: RemoteNode,
};

/**
 * Individual category exports for selective usage
 */
export const rootNodes = {
    Start: StartNode,
};

export const basicTypeNodes = {
    Nil: NilNode,
    String: StringNode,
    Number: NumberNode,
    Boolean: BooleanNode,
    Table: TableNode,
    Vector: VectorNode,
};

// export const controlFlowNodes = {
//     Condition: ConditionNode,
//     Loop: LoopNode,
//     Switch: SwitchNode,
// };

// export const functionNodes = {
//     Function: FunctionNode,
//     Return: ReturnNode,
//     Parameter: ParameterNode,
// };

// export const robloxNodes = {
//     Instance: InstanceNode,
//     Service: ServiceNode,
//     Event: EventNode,
//     Remote: RemoteNode,
// };