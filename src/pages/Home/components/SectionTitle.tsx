export default function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    // flex-1과 min-w-0을 추가해 부모 요소(flex) 안에서 영역을 유연하게 차지하고, 넘칠 경우 줄바꿈을 허용합니다.
    <div className="flex-1 min-w-0">
      <h2 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-slate-900 break-keep">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-xs sm:text-sm text-slate-500 break-keep">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
