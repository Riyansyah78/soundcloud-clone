import React, { useEffect, useRef, useState } from 'react';
import usePlayerStore from '../../store/usePlayerStore';

const StaticWaveform = ({ songUrl, isPlaying }) => {
  const canvasRef = useRef(null);
  const { currentTime, duration } = usePlayerStore();
  const [waveformData, setWaveformData] = useState(null); // Menyimpan data bentuk gelombang
  const [isLoading, setIsLoading] = useState(false);

  // 1. PROSES ANALISIS AUDIO (Dijalankan sekali saat lagu dimuat)
  useEffect(() => {
    if (!songUrl) return;

    const analyzeAudio = async () => {
      setIsLoading(true);
      try {
        // A. Download Audio File (Blob)
        const response = await fetch(songUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // B. Decode Audio Data (Ubah jadi raw PCM)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // C. Ambil Raw Data dari Channel Kiri (Mono saja cukup untuk visual)
        const rawData = audioBuffer.getChannelData(0);
        
        // D. Kompres Data (Downsampling)
        // Kita tidak mungkin gambar jutaan titik, kita cuma butuh sekitar 100 batang
        const samples = 100; // Jumlah batang
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          // Hitung rata-rata amplitude di blok ini
          for (let j = 0; j < blockSize; j++) {
             sum = sum + Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // E. Normalisasi (Agar batang tertinggi mentok 100%)
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        const normalizedData = filteredData.map(n => n * multiplier);

        setWaveformData(normalizedData);
      } catch (error) {
        console.error("Gagal generate waveform:", error);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeAudio();
  }, [songUrl]);

  // 2. PROSES GAMBAR CANVAS (Dijalankan terus utk update warna progress)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Config
    const gap = 2;
    const barWidth = (width / waveformData.length) - gap;
    
    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Hitung posisi progress (Garis Oranye)
    const progressPercent = (duration > 0) ? currentTime / duration : 0;
    
    // Gambar Batang
    waveformData.forEach((value, index) => {
      // Tinggi batang sesuai data audio asli
      // Kita kali 0.8 agar tidak terlalu mentok atas
      let barHeight = value * height * 0.9; 
      barHeight = Math.max(barHeight, 4); // Minimal tinggi 4px

      const x = index * (barWidth + gap);
      const y = height - barHeight;

      // Logic Warna:
      // Apakah batang ini sudah dilewati durasi lagu?
      // index / total_batang < persentase_lagu
      if (index / waveformData.length < progressPercent) {
        ctx.fillStyle = '#ff5500'; // SoundCloud Orange (Sudah diputar)
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Putih Abu (Belum diputar)
      }

      // Gambar Rect
      ctx.fillRect(x, y, barWidth, barHeight);
    });

  }, [waveformData, currentTime, duration]);

  if (isLoading) {
    return (
      <div className="w-full h-24 flex items-end justify-center gap-1 opacity-50 animate-pulse">
         <div className="text-xs text-white">Generating Waveform...</div>
      </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-24 mt-auto"
    />
  );
};

export default StaticWaveform;