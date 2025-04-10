/**
 * Convert timestamp in  ISO 8601 to local time
 * @param timestamp
 */
export function convertTimestamp(timestamp:string) {
    // Create a new Date object from the timestamp
    const date = new Date(timestamp);

    // Format the date and time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed in JavaScript
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Return the formatted string
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
