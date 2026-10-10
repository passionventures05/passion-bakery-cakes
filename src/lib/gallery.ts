/**
 * Photos for the home-page gallery. Put image files in /public/gallery/ and list them here:
 *   { src: "/gallery/unicorn-cake.webp", alt: "Unicorn birthday cake with gold horn" },
 * While the list is empty the gallery shows an Instagram call-to-action instead.
 */
export interface GalleryImage {
  src: string;
  alt: string;
}

export const gallery: GalleryImage[] = [];
