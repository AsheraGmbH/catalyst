// pages/api/get-product-image.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface Option
{
    optionEntityId: number;
    valueEntityId: number;
}

interface ProductVariant
{
    entityId: number;
    optionValueIds: Option[];
}

// Helper function to determine MIME type from file extension.
function getMimeType(filename: string): string
{
    const ext = path.extname(filename).toLowerCase();
    switch (ext)
    {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.avif':
            return 'image/avif';
        default:
            return 'application/octet-stream';
    }
}

/**
 * Determine the best image filename based on the product variant options and available images.
 *
 * @param product - The product variant object, containing entityId and optionValueIds.
 * @param availableImages - Array of filenames available in the product image folder.
 * @param defaultFilename - The fallback default filename if no specific image matches.
 *
 * @returns A relative filename (string) that best represents the product variant.
 */
export function determineImageFilename(
    product: ProductVariant,
    availableImages: string[],
    defaultFilename = 'default.avif'
): string
{
    // When no options are provided, return the default image.
    if (!product.optionValueIds || product.optionValueIds.length === 0)
    {
        return defaultFilename;
    }

    // Sort options by attributeId so that the order is consistent.
    const sortedOptions = product.optionValueIds.slice().sort((a, b) => a.optionEntityId - b.optionEntityId);

    // Build composite candidate filename (e.g. "152_45-153_10.jpg")
    const compositeCandidate =
        sortedOptions.map(opt => `${opt.optionEntityId}_${opt.valueEntityId}`).join('-') + '.avif';

    console.log('Composite Candidate:', compositeCandidate);

    if (availableImages.includes(compositeCandidate))
    {
        return compositeCandidate;
    }

    // Check for each individual option candidate (e.g. "152_45.jpg")
    for (const opt of sortedOptions)
    {
        const individualCandidate = `${opt.optionEntityId}_${opt.valueEntityId}.avif`;
        if (availableImages.includes(individualCandidate))
        {
            return individualCandidate;
        }
    }

    // Optionally, check for a constant image in the folder.
    const constantImage = availableImages.find(img => img.toLowerCase().includes('constant'));
    if (constantImage)
    {
        return constantImage;
    }

    // Fall back to the default image.
    return defaultFilename;
}

/**
 * Reads the image file from the provided folder and returns a Base64 data URI.
 *
 * @param folder - The absolute path to the folder where the image is located.
 * @param filename - The filename of the image.
 * @returns The Base64 data URI string.
 */
export function getImageDataUri(folder: string, filename: string): string | null
{
    // Build the complete file path.
    const imageFilePath = path.join(folder, filename);

    if (!fs.existsSync(imageFilePath))
    {
        return null;
    }

    try
    {
        // Read the file as a Buffer.
        const imageBuffer = fs.readFileSync(imageFilePath);
        const mimeType = getMimeType(filename);
        // Convert the Buffer to a Base64 string.
        const base64Image = imageBuffer.toString('base64');
        // Construct the data URI.
        return `data:${mimeType};base64,${base64Image}`;
    } catch (error)
    {
        console.error("Error reading image file:", error);
        return null;
    }
}

// get available images from the folder
export function getAvailableImages(productId: string): { images: string[]; path: string }
{
    // get the exact path of this file
    const filePath = path.resolve(process.cwd(), 'public');
    const imagesFolder = path.join(filePath, 'images');
    if (fs.existsSync(`${imagesFolder}/${productId}`))
    {
        return {
            images: fs.readdirSync(`${imagesFolder}/${productId}`),
            path: imagesFolder
        };
    }
    return {
        images: [],
        path: ''
    };
}