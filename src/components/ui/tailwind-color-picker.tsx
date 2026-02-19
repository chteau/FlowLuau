"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Props interface for the TailwindColorPicker component
 *
 * Defines configuration options for the color selection interface with callback
 * for value changes and optional styling customization.
 *
 * @interface TailwindColorPickerProps
 * @property {(value: { text: string; background: string }) => void} [onChange] - Callback triggered when color selection changes
 *   Receives an object with Tailwind CSS class names for text and background styling
 *   Example: { text: "text-blue-400", background: "bg-blue-400" }
 * @property {string} [className] - Optional additional CSS classes for the trigger button
 *   Applied to the outer Button component for custom styling or layout adjustments
 */
interface TailwindColorPickerProps {
    onChange?: (value: {
        text: string;
        background: string;
    }) => void;
    className?: string;
}

/**
 * Represents a selectable color option with Tailwind CSS class mappings
 *
 * Each option provides semantic naming alongside the specific utility classes required
 * for consistent text and background styling throughout the application UI.
 *
 * @interface ColorOption
 * @property {string} name - Human-readable display name for the color (e.g., "Blue", "Green")
 * @property {string} text - Tailwind CSS class for text coloring (e.g., "text-blue-400")
 * @property {string} background - Tailwind CSS class for background coloring (e.g., "bg-blue-400")
 * @property {string} preview - Tailwind CSS class used specifically for the color swatch preview
 *   Typically matches the background class but may differ for special visual treatments
 */
type ColorOption = {
    name: string;
    text: string;
    background: string;
    preview: string;
};

/**
 * Predefined set of color options for selection interface
 *
 * Contains a curated palette of 6 harmonious colors following Tailwind CSS naming conventions.
 * Each option provides consistent text/background pairings suitable for UI element theming.
 * Colors selected for optimal contrast and visual distinction in interface contexts.
 *
 * @constant COLOR_OPTIONS
 * @type {ColorOption[]}
 * @default
 * [
 *   { name: "Yellow", text: "text-yellow-400", background: "bg-yellow-400", preview: "bg-yellow-400" },
 *   { name: "Red", text: "text-red-400", background: "bg-red-400", preview: "bg-red-400" },
 *   ...5 more color options
 * ]
 */
const COLOR_OPTIONS: ColorOption[] = [
    {
        name: "Yellow",
        text: "text-yellow-400",
        background: "bg-yellow-400",
        preview: "bg-yellow-400",
    },
    {
        name: "Red",
        text: "text-red-400",
        background: "bg-red-400",
        preview: "bg-red-400",
    },
    {
        name: "Green",
        text: "text-green-400",
        background: "bg-green-400",
        preview: "bg-green-400",
    },
    {
        name: "Blue",
        text: "text-blue-400",
        background: "bg-blue-400",
        preview: "bg-blue-400",
    },
    {
        name: "Purple",
        text: "text-purple-400",
        background: "bg-purple-400",
        preview: "bg-purple-400",
    },
    {
        name: "Pink",
        text: "text-pink-400",
        background: "bg-pink-400",
        preview: "bg-pink-400",
    },
];

/**
 * TailwindColorPicker component provides a visual interface for selecting themed color pairs
 *
 * Renders a popover-triggered color selection grid that outputs Tailwind CSS utility classes
 * for consistent theming across UI components. Designed for scenarios requiring coordinated
 * text and background color selection (e.g., tag styling, status indicators, category coloring).
 *
 * Features:
 * - Visual color swatches with immediate preview feedback
 * - Semantic color naming for accessibility and authoring clarity
 * - Selection ring indicator highlighting currently chosen option
 * - Responsive 3-column grid layout optimized for quick scanning
 * - Hover animations enhancing interactive feedback (scale-105)
 * - Uncontrolled component pattern with optional onChange callback
 *
 * Usage patterns:
 * - Theme configuration panels for user-customizable interfaces
 * - Category/tag color assignment in content management systems
 * - Status indicator styling (e.g., "Approved" = green, "Rejected" = red)
 * - Visual differentiation of grouped UI elements requiring consistent theming
 *
 * Integration notes:
 * - Returns Tailwind class names rather than raw color values for framework consistency
 * - Requires parent component to manage selected state if controlled behavior needed
 * - Preview swatches use background classes; text classes applied to consuming components
 * - Default unselected state displays "Select color" placeholder text
 *
 * Accessibility:
 * - Button trigger provides semantic interaction point with keyboard navigation
 * - Color names included as text labels for screen reader users
 * - Visual selection indicator (ring) provides non-color-dependent selection feedback
 * - Sufficient contrast maintained between swatch colors and selection ring
 *
 * @component
 * @param {TailwindColorPickerProps} props - Component properties
 * @param {(value: { text: string; background: string }) => void} [props.onChange] - Selection change handler
 * @param {string} [props.className] - Additional classes for trigger button styling
 *
 * @example
 * // Basic usage with change handler
 * <TailwindColorPicker
 *   onChange={(colors) => {
 *     setTagStyles({
 *       textColor: colors.text,
 *       bgColor: colors.background
 *     });
 *   }}
 * />
 *
 * @example
 * // Integration with tag component theming
 * <div className={cn("inline-flex items-center px-2 py-1 rounded", selectedColor.background)}>
 *   <span className={cn("text-xs font-medium", selectedColor.text)}>
 *     Important
 *   </span>
 * </div>
 */
export function TailwindColorPicker({
    onChange,
    className,
}: TailwindColorPickerProps) {
    const [selected, setSelected] = React.useState<ColorOption | null>(null);

    /**
     * Handles color option selection and triggers change notification
     *
     * Updates local selected state and invokes optional onChange callback with
     * the selected color's Tailwind CSS class mappings. Enables parent components
     * to react to selection changes for theming or state management purposes.
     *
     * @param {ColorOption} option - The selected color configuration object
     * @returns {void}
     * @sideEffect Updates component state and invokes onChange callback if provided
     */
    function handleSelect(option: ColorOption) {
        setSelected(option);

        onChange?.({
            text: option.text,
            background: option.background,
        });
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("flex items-center gap-2", className)}
                >
                    {selected ? (
                        <>
                            <div
                                className={cn("w-4 h-4 rounded", selected.preview)}
                            />
                            {selected.name}
                        </>
                    ) : (
                        "Select color"
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-56 p-3">
                <div className="grid grid-cols-3 gap-3">
                    {COLOR_OPTIONS.map((option) => (
                        <button
                            key={option.name}
                            type="button"
                            onClick={() => handleSelect(option)}
                            className={cn(
                                "w-full h-10 rounded-md border transition hover:scale-105",
                                option.preview,
                                selected?.name === option.name &&
                                    "ring-2 ring-primary ring-offset-2"
                            )}
                            aria-label={`Select ${option.name} color`}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}