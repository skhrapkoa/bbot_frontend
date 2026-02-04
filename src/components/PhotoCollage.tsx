import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Import all photos from the photos folder
const photoModules = import.meta.glob('/public/photos/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });

export function PhotoCollage() {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    // Get all photo URLs from the glob import
    const photoUrls = Object.values(photoModules) as string[];
    
    if (photoUrls.length === 0) {
      setPhotos([]);
      return;
    }
    
    // Duplicate photos to fill the grid
    const duplicated = [...photoUrls];
    while (duplicated.length < 40) {
      duplicated.push(...photoUrls);
    }
    // Shuffle for variety
    const shuffled = duplicated.sort(() => Math.random() - 0.5);
    setPhotos(shuffled.slice(0, 40));
  }, []);

  if (photos.length === 0) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Photo grid - full visibility */}
      <div className="absolute inset-0 grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1">
        {photos.map((photo, i) => (
          <motion.div
            key={i}
            className="aspect-square overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: i * 0.03,
            }}
          >
            <motion.img
              src={photo}
              alt=""
              className="w-full h-full object-cover"
              animate={{
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 12 + Math.random() * 6,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          </motion.div>
        ))}
      </div>
      {/* Subtle vignette for center focus - очень лёгкий */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
