'use client';

import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceLiveness() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoStarted, setVideoStarted] = useState(false);
  const [, setIsFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [movementProgress, setMovementProgress] = useState(0);
  const [, setIsMovementValidated] = useState(false);
  const [initialNosePosition, setInitialNosePosition] = useState<{ x: number; y: number } | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  async function loadModels() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    }
  }

  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
    }
  }

  async function detectFace() {
    if (!videoRef.current) return;
    try {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      console.log('Detecção de rostos:', detections);
      setIsFaceDetected(detections.length > 0);

      if (detections.length > 0) {
        const landmarks = detections[0].landmarks;
        const nose = landmarks.getNose()[0];
        validateMovement(nose);
      }
    } catch (error) {
      console.error('Erro ao detectar rosto:', error);
    }
  }

  function validateMovement(nose: { x: number; y: number }) {
    if (!initialNosePosition) {
      setInitialNosePosition({ x: nose.x, y: nose.y });
      return;
    }

    const deltaX = Math.abs(nose.x - initialNosePosition.x);
    const deltaY = Math.abs(nose.y - initialNosePosition.y);
    const movementThreshold = 20;
    const totalMovement = Math.min(100, (deltaX + deltaY) * 2);

    setMovementProgress(totalMovement);
    if (totalMovement >= movementThreshold) {
      setIsMovementValidated(true);
    }
  }

  async function captureImage() {
    console.log('aqui')
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    setCapturedImage(canvasRef.current.toDataURL('image/png'));
    setIsCompleted(true);
  }

  useEffect(() => {
    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [detectFace, initialNosePosition]);

  useEffect(() => {
    if (movementProgress >= 100) {
      captureImage();
    }
  }, [movementProgress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      <h1 className="text-2xl font-bold mb-4 text-black">Face Liveness</h1>

      {!videoStarted && <button className="mt-4 cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg" onClick={() => {
        setVideoStarted(true)
        startVideo();
        loadModels();
      }}>Iniciar</button>}
      {(!isCompleted || videoStarted) && (
        <div
          className="relative overflow-hidden bg-black"
          id="image"
          style={{
            width: "200px",
            height: "300px",
            borderRadius: "50% / 30%",
            borderBottomLeftRadius: "50% 20%",
            borderBottomRightRadius: "50% 20%",
            position: "relative",
            background: `conic-gradient(#4CAF50 ${movementProgress * 3.6}deg, transparent 0)`,
            border: "8px solid transparent", // Espaço para a borda
            transition: "background 0.5s ease", // Transição suave
            transformOrigin: "center", // Faz o movimento começar de cima
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => console.error("Erro no vídeo:", e)}
            onPlay={() => console.log("Vídeo carregado e tocando")}
            onLoadedData={() => console.log("Dados do vídeo carregados")}
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      {capturedImage && (
        <>
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Imagem Capturada:</h2>
            <img
              src={capturedImage}
              alt="Captured Face"
              className="mt-2 rounded-lg shadow-md"
            />
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Não ficou boa
          </button>
        </>
      )}
    </div>
  );
}