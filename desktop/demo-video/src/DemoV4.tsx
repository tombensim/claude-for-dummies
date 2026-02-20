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
  { file: "02-welcome-page.jpg", title: "ברוכים הבאים", subtitle: "Welcome to CC4D" },
  { file: "03-build-page-empty.jpg", title: "בוא נבין מה אתה צריך", subtitle: "Tell us what you want to build" },
  { file: "04-typed-prompt.jpg", title: "מתארים את הרעיון", subtitle: "Describing the idea in Hebrew" },
  { file: "05-message-sent.jpg", title: "שולחים את ההודעה", subtitle: "Sending the prompt" },
  { file: "06-ai-plan-response.jpg", title: "AI יוצר תוכנית", subtitle: "AI generates a plan" },
  { file: "07-project-panel.jpg", title: "פאנל הפרויקט", subtitle: "Project panel with timeline" },
  { file: "08-setup-not-connected.jpg", title: "דף ההגדרות", subtitle: "Setup & connection status" },
];

const SLIDE_DURATION = 40; // frames per slide (1.33s at 30fps)
const TRANSITION = 10; // transition frames

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
          src={staticFile(`screenshots-v4/${src}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${interpolate(enterProgress, [0, 1], [1.05, 1])})`,
          }}
        />
      </AbsoluteFill>
      {/* Title overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            borderRadius: 16,
            padding: "16px 32px",
            transform: `translateY(${interpolate(enterProgress, [0, 1], [30, 0])}px)`,
          }}
        >
          <div
            style={{
              color: "#FFD700",
              fontSize: 36,
              fontWeight: "bold",
              fontFamily: "sans-serif",
              textAlign: "center",
              direction: "rtl",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "white",
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
  const opacity = interpolate(frame, [0, 10, 50, 60], [0, 1, 1, 0], {
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
            fontSize: 72,
            fontWeight: "bold",
            fontFamily: "sans-serif",
            color: "#1a1a1a",
            transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)`,
          }}
        >
          Claude Code למתחילים
        </div>
        <div
          style={{
            fontSize: 36,
            fontFamily: "sans-serif",
            color: "#333",
            marginTop: 16,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          v4 — After Major Refactoring
        </div>
        <div
          style={{
            fontSize: 24,
            fontFamily: "sans-serif",
            color: "#555",
            marginTop: 32,
          }}
        >
          15 issues fixed • SSE rewrite • Store refactoring • Accessibility
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DemoV4: React.FC = () => {
  const INTRO_DURATION = 60;

  return (
    <AbsoluteFill style={{ background: "#1a1a1a" }}>
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
