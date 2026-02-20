import { Composition } from "remotion";
import { DemoV4 } from "./DemoV4";
import { DemoV6 } from "./DemoV6";
import { DemoV7 } from "./DemoV7";

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
      <Composition
        id="DemoV6"
        component={DemoV6}
        durationInFrames={510}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DemoV7"
        component={DemoV7}
        durationInFrames={615}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
