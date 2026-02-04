import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Import all photos from the photos folder
const photoModules = import.meta.glob('/public/photos/*.{jpg,jpeg,png,webp}', { eager: true, as: 'url' });

export function PhotoCollage() {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    // Get all photo URLs from the glob import
    const photoUrls = Object.values(photoModules).map(url => 
      // Convert /public/photos/... to /photos/...
      url.replace('/public', '')
    );
    
    // If no photos found, use placeholder pattern
    if (photoUrls.length === 0) {
      // Generate placeholder grid
      setPhotos([]);
      return;
    }
    
    // Duplicate photos to fill the grid
    const duplicated = [...photoUrls];
    while (duplicated.length < 30) {
      duplicated.push(...photoUrls);
    }
    setPhotos(duplicated.slice(0, 30));
  }, []);

  if (photos.length === 0) {
    // Fallback: animated gradient squares when no photos
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-6 gap-2 p-4 opacity-10">
          {[...Array(36)].map((_, i) => (
            <motion.div
              key={i}
              className="aspect-square rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-600/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29]/90 via-[#302b63]/85 to-[#24243e]/90" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 p-2">
        {photos.map((photo, i) => (
          <motion.div
            key={i}
            className="aspect-square overflow-hidden rounded-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: i * 0.05,
            }}
          >
            <motion.img
              src={photo}
              alt=""
              className="w-full h-full object-cover filter grayscale-[30%] brightness-75"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 10 + Math.random() * 5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          </motion.div>
        ))}
      </div>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29]/85 via-[#302b63]/80 to-[#24243e]/85" />
    </div>
  );
}
