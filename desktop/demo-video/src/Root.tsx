import { Composition } from "remotion";
import { DemoV4 } from "./DemoV4";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DemoV4"
        component={DemoV4}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
