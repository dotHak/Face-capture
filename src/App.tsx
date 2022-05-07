import { useEffect, useState } from "react";
import "./App.css";
import { Face } from "./components/Face";

function App() {
  const [imageBlob, setImageBlob] = useState<Blob | null>();
  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>(
    []
  );
  const [cameraCount, setCameraCount] = useState(0);
  const [restart, setRestart] = useState(false);

  useEffect(() => {
    getMediaDevicesIds();
  }, []);

  const getMediaDevicesIds = async () => {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    let mDevices = mediaDevices.map((media) => ({
      deviceId: media.deviceId,
      label: media.label,
    }));
    mDevices = mDevices.filter((media) => media.deviceId);
    setDevices(mDevices);
  };

  const switchCamera = async () => {
    console.log("restarted");
    const count = cameraCount < devices.length - 1 ? cameraCount + 1 : 0;
    setCameraCount(count);
  };

  return (
    <div className="App">
      <h1>Video Capture</h1>

      {devices.length > 1 && <p>Camera: {devices[cameraCount].label}</p>}
      <div className="media">
        {devices.length > 0 && (
          <Face
            device={devices[cameraCount].deviceId}
            handSavePhoto={(data) => setImageBlob(data)}
            restart={restart}
          />

          // <DetectFace
          //   device={devices[cameraCount].deviceId}
          //   handSavePhoto={(data) => setImageBlob(data)}
          //   restart={restart}
          // />
        )}
        {imageBlob && <img src={URL.createObjectURL(imageBlob)} alt="Image" />}
      </div>

      {devices.length > 1 && (
        <button className="camera" onClick={switchCamera}>
          Switch Camera
        </button>
      )}
      <button className="restart" onClick={() => setRestart((c) => !c)}>
        Retake
      </button>
    </div>
  );
}

export default App;
