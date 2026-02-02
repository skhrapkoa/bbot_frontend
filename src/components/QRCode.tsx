import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 250 }: QRCodeProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="bg-white p-6 rounded-3xl shadow-2xl"
    >
      <QRCodeSVG 
        value={value} 
        size={size}
        level="M"
        includeMargin={false}
        bgColor="#ffffff"
        fgColor="#000000"
      />
    </motion.div>
  );
}
