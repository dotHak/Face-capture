import {
  BlazeFaceModel,
  load as loadModel,
} from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs-backend-webgl";
import { useEffect, useRef, useState } from "react";

interface DetectFaceProps {
  device: string;
  handSavePhoto: (data: Blob | null) => void;
  restart: boolean;
}

export const Face: React.FC<DetectFaceProps> = ({
  device,
  handSavePhoto,
  restart,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<BlazeFaceModel>();
  const [face, setFace] = useState(false);

  useEffect(() => {
    loadModel()
      .then((net) => setModel(net))
      .then((err) => console.error(err))
      .finally(() => console.log("loaded"));
  }, []);

  useEffect(() => {
    startStream(device);
    const interval = setInterval(detectImage, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [device, restart, model]);

  const detectImage = async () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const { videoWidth, videoHeight } = video;
      canvasRef.current!.width = videoWidth;
      canvasRef.current!.height = videoHeight;

      try {
        if (model) {
          const predictions = await model.estimateFaces(video, false);
          if (!!predictions.length) {
            const topLeft = predictions[0].topLeft as [number, number];
            const bottomRight = predictions[0].bottomRight as [number, number];

            let width = 2 * (bottomRight[1] - topLeft[1]);
            let height = 2 * (bottomRight[0] - topLeft[0]);
            let x = topLeft[0] - 0.15 * width;
            let y = topLeft[1] - 0.35 * height;
            x = x < 0 ? 0 : x;
            y = y < 0 ? 0 : y;
            width = width + x >= videoWidth ? videoWidth - x : width;
            height = height + y >= videoHeight ? videoHeight - y : height;
            const rect = { x, y, width, height };
            console.log(rect);
            console.log(video.videoWidth, video.videoHeight);
            const prob = (predictions[0].probability as any)[0];
            if (prob >= 0.99) {
              drawFaceRect(rect);
              setTimeout(() => {
                extractFace(rect);
              }, 0);
            }
          }
        }
      } catch (error) {
        console.error("error");
      }
    }
  };

  const drawFaceRect = (params: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (canvasRef.current) {
      const { x, y, width, height } = params;
      const ctx = canvasRef.current?.getContext("2d")!;
      ctx.lineWidth = 5;
      ctx.strokeStyle = "red";
      ctx.strokeRect(x, y, width, height);
    }
  };

  const extractFace = async (params: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    const { x, y, width, height } = params;
    const video = videoRef.current!;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    const image = new Image();

    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");

    image.src = dataUrl;

    const can = document.createElement("canvas");
    can.width = width;
    can.height = height;
    const ctx = can.getContext("2d");
    image.onload = () => {
      ctx?.drawImage(image, x, y, width, height, 0, 0, width, height);
      can.toBlob((blob) => {
        handSavePhoto(blob);
      }, "image/jpeg");
    };

    // stopStream();
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
