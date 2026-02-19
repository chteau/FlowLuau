"use server";

/**
 * Fetches thumbnail metadata for a Roblox game universe from the official Roblox Thumbnails API
 *
 * Retrieves visual assets (icons, thumbnails, etc.) associated with a Roblox game universe ID.
 * Uses the multiget endpoint to fetch multiple thumbnail types in a single request, though
 * currently only processes the first result in the response array.
 *
 * API details:
 * - Endpoint: https://thumbnails.roblox.com/v1/games/multiget/thumbnails
 * - Size parameter: 768x432 (standard widescreen game thumbnail size)
 * - Format: PNG with transparency support
 * - Shape: Rectangular (isCircular=false)
 *
 * Error handling behavior:
 * - Network errors and non-2xx responses are caught and logged as warnings
 * - Returns null on any failure to prevent blocking application flow
 * - Does NOT throw errors to caller (safe for server component usage)
 *
 * Security considerations:
 * - Only makes outbound requests to official Roblox domains (thumbnails.roblox.com)
 * - No authentication required (public API endpoint)
 * - Input validation: universeId should be numeric string (enforced by caller)
 *
 * Performance characteristics:
 * - Single network request with ~2-5 second timeout (default fetch behavior)
 * - Caching: Relies on Roblox CDN caching; no client-side caching implemented here
 * - Typical response size: < 1KB JSON metadata (actual images loaded client-side via URLs in response)
 *
 *
 * @async
 * @function getRobloxGameThumbnails
 * @param {string} universeId - Numeric Roblox universe identifier (e.g., "123456789")
 *   Must be a valid universe ID owned by an existing Roblox game
 * @returns {Promise<RobloxThumbnailData | null>} Thumbnail metadata object or null on failure
 * @throws {never} Never throws - errors are caught and logged internally
 *
 * @example
 * // Basic usage in server component
 * const thumbnail = await getRobloxGameThumbnails("123456789");
 * if (thumbnail?.thumbnails?.[0]?.state === "Completed") {
 *   return <img src={thumbnail.thumbnails[0].imageUrl} alt="Game thumbnail" />;
 * }
 *
 * @example
 * // Error-tolerant usage with fallback
 * const thumbnail = await getRobloxGameThumbnails(universeId) ?? {
 *   thumbnails: [{ imageUrl: "/fallback-thumbnail.png", state: "Completed" }]
 * };
 */
export async function getRobloxGameThumbnails(universeId: string): Promise<RobloxThumbnailData | null>{
    try {
        const response = await fetch(
            `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=Png&isCircular=false`,
            {
                next: { revalidate: 3600 },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json: RobloxThumbnailResponse = await response.json();

        // Validate response structure before returning
        if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
            console.warn(`No thumbnail data found for universe ID: ${universeId}`);
            return null;
        }

        return json.data[0] ?? null;
    } catch (err) {
        console.warn(
            `Failed to fetch Roblox thumbnail for universe ${universeId}:`,
            err instanceof Error ? err.message : "Unknown error"
        );
        return null;
    }
}

/**
 * Type definition for Roblox Thumbnails API response structure
 *
 * Represents the expected shape of responses from the multiget thumbnails endpoint.
 * Only includes fields actually used by the application to minimize type surface area.
 *
 * @interface RobloxThumbnailResponse
 * @property {Array<{ universeId: number; thumbnails: RobloxThumbnailItem[] }>} data - Array of universe thumbnail results
 *   Typically contains one entry matching the requested universeId
 */
interface RobloxThumbnailResponse {
    data: Array<{
        universeId: number;
        thumbnails: RobloxThumbnailItem[];
    }>;
}

/**
 * Type definition for individual thumbnail metadata items
 *
 * Represents a single thumbnail asset within a universe's thumbnail collection.
 * Includes state tracking and CDN URL for client-side image loading.
 *
 * @interface RobloxThumbnailItem
 * @property {number} targetId - The image ID of the thumbnail in roblox servers
 * @property {string} state - Processing state of thumbnail ("Completed", "Pending", "Error")
 * @property {string} imageUrl - Absolute CDN URL to the generated thumbnail image
 * @property {string} version - The image version in roblox servers
 */
interface RobloxThumbnailItem {
    targetId: number;
    state: string;
    imageUrl: string;
    version: string;
}

/**
 * Type alias for the returned thumbnail data structure
 *
 * Represents the shape of data returned by getRobloxGameThumbnails function.
 * Matches the first element of the response data array.
 *
 * @typedef {Object} RobloxThumbnailData
 * @property {number} universeId - Numeric universe identifier
 * @property {RobloxThumbnailItem[]} thumbnails - Array of thumbnail variants for this universe
 */
type RobloxThumbnailData = RobloxThumbnailResponse["data"][0];