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
 * import { nodeTypes } from "@/components/project/script-editor/nodes/manifest";
 *
 * <ReactFlow
 *   nodeTypes={nodeTypes}
 *   // ...
 * />
 */

import StartNode from "./Start";
import EndNode from "./End";

import NilNode from "./Available/BasicTypes/Nil";
import StringNode from "./Available/BasicTypes/String";
import NumberNode from "./Available/BasicTypes/Number";
import BooleanNode from "./Available/BasicTypes/Boolean";
import TableNode from "./Available/BasicTypes/Table";

import IfElseNode from "./Available/ControlFlow/IfElse";
import ConditionNode from "./Available/ControlFlow/Condition";
import RepeatUntilLoopNode from "./Available/ControlFlow/RepeatUntil";
import WhileLoopNode from "./Available/ControlFlow/WhileLoop";
import ForLoopNode from "./Available/ControlFlow/ForLoop";
import BreakStatementNode from "./Available/ControlFlow/Break";
import ContinueStatementNode from "./Available/ControlFlow/Continue";
import ReturnStatementNode from "./Available/ControlFlow/Return";

import VariableGetNode from "./Available/Variables/VariableGet";
import VariableSetNode from "./Available/Variables/VariableSet";
import FunctionDefinitionNode from "./Available/Functions/FunctionDefinition";
import FunctionCallNode from "./Available/Functions/FunctionCall";

import AddNode from "./Available/Arithmetic/Add";
import SubtractNode from "./Available/Arithmetic/Subtract";
import MultiplyNode from "./Available/Arithmetic/Multiply";
import DivideNode from "./Available/Arithmetic/Divide";
import ModulusNode from "./Available/Arithmetic/Modulus";

import AndNode from "./Available/Logical/And";
import OrNode from "./Available/Logical/Or";
import NotNode from "./Available/Logical/Not";

import EqualNode from "./Available/Comparison/Equal";
import NotEqualNode from "./Available/Comparison/NotEqual";
import GreaterThanNode from "./Available/Comparison/GreaterThan";
import GreaterThanOrEqualNode from "./Available/Comparison/GreaterThanOrEqual";
import LessThanNode from "./Available/Comparison/LessThan";
import LessThanOrEqualNode from "./Available/Comparison/LessThanOrEqual";

import PrintNode from "./Available/SideEffects/Print";

import TableConcatNode from "./Available/Table/Concat";
import TableForeachNode from "./Available/Table/Foreach";
import TableInsertNode from "./Available/Table/Insert";
import TableRemoveNode from "./Available/Table/Remove";
import TableSortNode from "./Available/Table/Sort";
import TablePackNode from "./Available/Table/Pack";
import TableUnpackNode from "./Available/Table/Unpack";
import TableMoveNode from "./Available/Table/Move";
import TableCreateNode from "./Available/Table/Create";
import TableFindNode from "./Available/Table/Find";
import TableClearNode from "./Available/Table/Clear";
import TableFreezeNode from "./Available/Table/Freeze";
import TableIsFrozenNode from "./Available/Table/IsFrozen";
import TableCloneNode from "./Available/Table/Clone";

/**
 * Consolidated node types registry
 *
 * Combines all node types from different categories into a single object
 * that can be directly passed to React Flow"s nodeTypes prop.
 */
export const nodeTypes = {
    // Root Nodes
    Start: StartNode,
    End: EndNode,

    // Basic Types Nodes
    Nil: NilNode,
    String: StringNode,
    Number: NumberNode,
    Boolean: BooleanNode,
    Table: TableNode,

    // Control Flow Nodes
    IfElse: IfElseNode,
    Condition: ConditionNode,
    RepeatUntilLoop: RepeatUntilLoopNode,
    WhileLoop: WhileLoopNode,
    ForLoop: ForLoopNode,
    BreakStatement: BreakStatementNode,
    ContinueStatement: ContinueStatementNode,
    ReturnStatement: ReturnStatementNode,

    // Variables & Functions Nodes
    VariableGet: VariableGetNode,
    VariableSet: VariableSetNode,
    FunctionDefinition: FunctionDefinitionNode,
    FunctionCall: FunctionCallNode,

    // Arithmetic Nodes
    Add: AddNode,
    Subtract: SubtractNode,
    Multiply: MultiplyNode,
    Divide: DivideNode,
    Modulus: ModulusNode,

    // Logical Operators Nodes
    And: AndNode,
    Or: OrNode,
    Not: NotNode,

    // Comparison Operators Nodes
    Equal: EqualNode,
    NotEqual: NotEqualNode,
    GreaterThan: GreaterThanNode,
    GreaterThanOrEqual: GreaterThanOrEqualNode,
    LessThan: LessThanNode,
    LessThanOrEqual: LessThanOrEqualNode,

    // Side Effects Nodes
    Print: PrintNode,

    // Table standard library
    TableConcat: TableConcatNode,
    TableForeach: TableForeachNode,
    TableInsert: TableInsertNode,
    TableRemove: TableRemoveNode,
    TableSort: TableSortNode,
    TablePack: TablePackNode,
    TableUnpack: TableUnpackNode,
    TableMove: TableMoveNode,
    TableCreate: TableCreateNode,
    TableFind: TableFindNode,
    TableClear: TableClearNode,
    TableFreeze: TableFreezeNode,
    TableIsFrozen: TableIsFrozenNode,
    TableClone: TableCloneNode,
};