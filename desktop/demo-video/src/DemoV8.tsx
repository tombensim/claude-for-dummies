import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

const slides = [
  { file: "01-setup.jpg", title: "Setup", subtitle: "Runtime checks and app bootstrap" },
  { file: "02-welcome.jpg", title: "Welcome", subtitle: "Start or resume a project" },
  { file: "03-build-initial.jpg", title: "Build Workspace", subtitle: "Chat + progress flow starts" },
  { file: "04-prompt-typed.jpg", title: "User Prompt", subtitle: "Describe what to build" },
  { file: "05-after-send.jpg", title: "Message Sent", subtitle: "Plan/build stream begins" },
  { file: "06-assistant-response.jpg", title: "Assistant Response", subtitle: "Early response in chat" },
  { file: "07-question-card-seeded.jpg", title: "Question Card", subtitle: "Multi-question card rendered" },
  { file: "08-question-continue-visible.jpg", title: "Scroll Fix", subtitle: "Continue button fully visible" },
  { file: "09-ship-page.jpg", title: "Ship", subtitle: "Deployment flow entry point" },
  { file: "10-done-page.jpg", title: "Done", subtitle: "Completion and next actions" },
];

const SLIDE_DURATION = 42;
const INTRO_DURATION = 54;

const Slide: React.FC<{ src: string; title: string; subtitle: string }> = ({
  src,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({ frame, fps, config: { damping: 100 } });
  const opacity = interpolate(frame, [0, 8, SLIDE_DURATION - 8, SLIDE_DURATION], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill>
        <Img
          src={staticFile(`screenshots-v8/${src}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${interpolate(enterProgress, [0, 1], [1.04, 1])})`,
          }}
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: 56,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.72)",
            borderRadius: 14,
            padding: "14px 28px",
            minWidth: 760,
          }}
        >
          <div
            style={{
              color: "#FFD700",
              fontSize: 32,
              fontWeight: 700,
              fontFamily: "sans-serif",
              textAlign: "center",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#FFFFFF",
              fontSize: 20,
              fontFamily: "sans-serif",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const IntroSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleSpring = spring({ frame, fps, config: { damping: 100 } });
  const opacity = interpolate(frame, [0, 8, INTRO_DURATION - 8, INTRO_DURATION], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 66,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "#1a1a1a",
            transform: `translateY(${interpolate(titleSpring, [0, 1], [36, 0])}px)`,
          }}
        >
          Claude for Dummies
        </div>
        <div
          style={{
            fontSize: 34,
            fontFamily: "sans-serif",
            color: "#2b2b2b",
            marginTop: 12,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [22, 0])}px)`,
          }}
        >
          QA Flow v8
        </div>
        <div
          style={{
            fontSize: 22,
            fontFamily: "sans-serif",
            color: "#444",
            marginTop: 24,
          }}
        >
          Setup to Build to Question Card to Ship to Done
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DemoV8: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Sequence durationInFrames={INTRO_DURATION}>
        <IntroSlide />
      </Sequence>
      {slides.map((slide, i) => (
        <Sequence
          key={i}
          from={INTRO_DURATION + i * SLIDE_DURATION}
          durationInFrames={SLIDE_DURATION}
        >
          <Slide src={slide.file} title={slide.title} subtitle={slide.subtitle} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
