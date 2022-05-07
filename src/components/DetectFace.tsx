import {
  detectSingleFace,
  extractFaces,
  matchDimensions,
  nets,
  Rect,
  TinyFaceDetectorOptions,
} from "face-api.js";
import { useEffect, useRef } from "react";
interface DetectFaceProps {
  device: string;
  handSavePhoto: (data: Blob | null) => void;
  restart: boolean;
}

export const DetectFace: React.FC<DetectFaceProps> = ({
  device,
  handSavePhoto,
  restart,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    nets.tinyFaceDetector.loadFromUri("models");
  }, []);

  useEffect(() => {
    console.log("running ...");
    startStream(device);
    const interval = setInterval(detectImage, 500);
    return () => {
      clearInterval(interval);
    };
  }, [device, restart]);

  const detectImage = async () => {
    if (videoRef.current) {
      const canvas = canvasRef.current!;
      const video = videoRef.current;
      try {
        const detection = await detectSingleFace(
          video,
          new TinyFaceDetectorOptions()
        );
        matchDimensions(canvas, video, true);
        if (detection) {
          const { x, y, height, width } = detection.box;
          const rect = {
            x: x - 0.5 * width,
            y: y - 0.5 * height,
            width: 2 * width,
            height: 2 * height,
          };

          drawFaceRect(rect);

          if (detection.score >= 0.6) {
            setTimeout(() => {
              extractFace(rect);
              canvas
                .getContext("2d")
                ?.clearRect(0, 0, canvas.width, canvas.height);
            }, 200);
          }
        } else {
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        }
      } catch (error) {
        console.log("error");
      }
    }
  };

  const drawFaceRect = (params: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const { x, y, width, height } = params;
    const ctx = canvasRef.current?.getContext("2d")!;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, width, height);
  };

  const extractFace = async (params: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const { x, y, width, height } = params;
    const video = videoRef.current!;
    const region = [new Rect(x, y, width, height)];

    const faceImages = await extractFaces(video, region);
    if (faceImages.length > 0) {
      faceImages[0].toBlob((blob) => {
        handSavePhoto(blob);
      }, "image/jpeg");
    }

    stopStream();
  };

  const startStream = async (deviceId?: string) => {
    if (videoRef.current) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(deviceId && { deviceId }),
          },
        });
        videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.log(err);
      }
    }
  };

  const stopStream = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject! as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="face">
      <video ref={videoRef} autoPlay muted></video>
      <canvas ref={canvasRef} id="overlay" />
    </div>
  );
};
