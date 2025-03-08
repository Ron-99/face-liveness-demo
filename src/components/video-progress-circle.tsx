import React, { useImperativeHandle } from 'react';

interface VideoProgressCircleProps {
  progress: number;
  videoRef: React.RefObject<HTMLVideoElement | null> // Tipo para o ref do vídeo
}

const VideoProgressCircle = ({ progress, videoRef }: VideoProgressCircleProps, ref: React.Ref<HTMLVideoElement>) => {
  const radius = 50; // Raio do círculo
  const circumference = 2 * Math.PI * radius; // Circunferência do círculo
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const videoElementRef = videoRef

  // Expondo o ref para o componente pai
  useImperativeHandle(ref, () => videoElementRef.current!);

  return (
    <div className="video-container">
      <svg className="circle" width="200" height="200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="lightgray"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="blue"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="progress-circle"
        />
      </svg>
      <video
        ref={videoElementRef} // Usando o ref do vídeo
        className="video"
        src="/path-to-your-video.mp4"
        autoPlay
        muted
        loop
      />
    </div>
  );
};

export default React.forwardRef(VideoProgressCircle);
