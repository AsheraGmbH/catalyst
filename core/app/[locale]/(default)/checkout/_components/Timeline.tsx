interface TimelineProps {
    isEngraving?: boolean;
}

const Timeline = ({ isEngraving }: TimelineProps) => {
    const currentWeek = 1;
    const weeks = [
        { id: 1, title: "Week 1", description: "Wood selection & stabilization" },
        { id: 2, title: "Week 2 - 3", description: "Turning & finishing the wood" },
        { id: 3, title: "Week 4", description: "Nib tuning & QC" },
        isEngraving ? { id: 4, title: "Week 5", description: "Engraving" } : null,
        { id: 5, title: isEngraving ? "Week 6" : "Week 5", description: "Shipping" },
    ].filter(Boolean) as { id: number; title: string; description: string }[];

    return (
        <div className="max-w-md mx-auto p-2">
            <h2 className="text-xl font-heading font-bold mb-2">Timeline</h2>
            <p className="mb-2 text-sm text-white">We will craft this pen just for you. You'll receive an update on progress each week.</p>
            <div className="flex flex-col py-2 space-y-4">
                {weeks.map((week, index) => {
                    const isCurrent = week.id === currentWeek;
                    const isPast = week.id < currentWeek;
                    const isCompleted = week.id <= currentWeek;
                    const showLineBelow = index < weeks.length - 1 && (isPast || isCurrent);

                    return (
                        <div key={week.id} className="relative flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 z-10 ${isCompleted ? "border-blue-500" : "border-gray-300"
                                        }`}
                                />
                                {showLineBelow && (
                                    <div
                                        className={`w-[1.4px] mt-1 ${isCurrent ? "animate-flow" : ""
                                            }`}
                                        style={{ height: '1rem', backgroundColor: isCurrent ? 'transparent' : '#3b82f6' }}
                                    />
                                )}
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-semibold text-sm">{week.title}</h3>
                                <p className="text-contrast-200 text-xs">{week.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-gray-400 text-xs mt-2">Note: Occasionally, there may be slight delays due to procuring specific woods or material issues. If anything unexpected happens, we'll keep you updated at every step.</p>
        </div>
    );
};

export default Timeline;
