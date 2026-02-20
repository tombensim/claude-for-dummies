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
  { file: "01-setup-screen.jpg", title: "הגדרות ראשוניות", subtitle: "Setup & Claude connection" },
  { file: "02-welcome.jpg", title: "ברוכים הבאים", subtitle: "Welcome to CC4D" },
  { file: "03-build-plan-mode.jpg", title: "מצב תכנון", subtitle: "Plan Mode — AI asks questions first" },
  { file: "04-typed-prompt.jpg", title: "מתארים את הרעיון", subtitle: "Describing the idea in Hebrew" },
  { file: "05-claude-response-english.jpg", title: "Claude מגיב", subtitle: "AI response with plan" },
  { file: "06-plan-with-approve-button.jpg", title: "אישור התוכנית", subtitle: "Review & approve the plan" },
  { file: "07-plan-expanded.jpg", title: "תוכנית מורחבת", subtitle: "Expanded plan details" },
  { file: "08-build-mode-started.jpg", title: "מצב בנייה", subtitle: "Build mode — AI starts coding" },
  { file: "09-build-files-4.jpg", title: "יוצר קבצים", subtitle: "Files being created" },
  { file: "10-fresh-build-page.jpg", title: "מוכן לפרויקט הבא", subtitle: "Ready for the next project" },
];

const SLIDE_DURATION = 45; // frames per slide (~1.5s at 30fps)

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
          src={staticFile(`screenshots-v6/${src}`)}
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
          v6 — Plan Mode + Build Flow
        </div>
        <div
          style={{
            fontSize: 24,
            fontFamily: "sans-serif",
            color: "#555",
            marginTop: 32,
          }}
        >
          תכנון → אישור → בנייה • Hebrew-first UX
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DemoV6: React.FC = () => {
  const INTRO_DURATION = 60;
  const totalDuration = INTRO_DURATION + slides.length * SLIDE_DURATION;

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
