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
  { file: "01-setup-page.jpg", title: "הגדרות ראשוניות", subtitle: "Setup — checking environment" },
  { file: "02-setup-partial.jpg", title: "מתחברים", subtitle: "Connecting to Claude" },
  { file: "03-welcome-page.jpg", title: "ברוכים הבאים", subtitle: "Welcome — describe your idea" },
  { file: "04-plan-mode-start.jpg", title: "מצב תכנון", subtitle: "Plan Mode — AI asks questions first" },
  { file: "05-plan-mode-typing.jpg", title: "כותבים את הרעיון", subtitle: "Typing the idea in Hebrew" },
  { file: "07-plan-mode-input-typed.jpg", title: "הרעיון מוכן", subtitle: "Idea ready to send" },
  { file: "08-plan-mode-after-send.jpg", title: "Claude מתכנן", subtitle: "Claude processing the plan" },
  { file: "09-build-review-phase.jpg", title: "סקירה", subtitle: "Review — what do you think?" },
  { file: "10-improve-phase.jpg", title: "שיפורים", subtitle: "Improve — add features, fix, redesign" },
  { file: "11-ship-page.jpg", title: "מוכן לאינטרנט?", subtitle: "Ship — deploy or keep working" },
  { file: "12-done-page.jpg", title: "באוויר! 🎉", subtitle: "Done — your site is live" },
];

const SLIDE_DURATION = 50;

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
          src={staticFile(`screenshots-v7/${src}`)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${interpolate(enterProgress, [0, 1], [1.05, 1])})`,
          }}
        />
      </AbsoluteFill>
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
  const opacity = interpolate(frame, [0, 10, 55, 65], [0, 1, 1, 0], {
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
          v7 — Full User Flow
        </div>
        <div
          style={{
            fontSize: 24,
            fontFamily: "sans-serif",
            color: "#555",
            marginTop: 32,
          }}
        >
          Setup → Plan → Build → Ship → Done
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DemoV7: React.FC = () => {
  const INTRO_DURATION = 65;

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
