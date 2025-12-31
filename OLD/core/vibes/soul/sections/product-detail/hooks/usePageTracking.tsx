'use client';

import { useEffect, useState, useCallback } from 'react';

interface TimeTrackingData
{
    timeSpent: number; // Time in seconds
    startTimestamp: number; // Timestamp when tracking started
}

interface SelectionTrackingData
{
    nonDefaultSelections: string[]; // Array of selected non-default values
    startTimestamp: number; // Timestamp when selections started
}

interface TrackingDataResult
{
    timeSpent: number;
    nonDefaultSelections: string[];
    hasMultipleNonDefaultSelections: boolean;
}

export function usePageTracking(selectName: string, initialValue: string = '', resetSelections: boolean = false)
{
    const [timeData, setTimeData] = useState<TimeTrackingData>({
        timeSpent: 0,
        startTimestamp: Date.now(),
    });
    const [selectionData, setSelectionData] = useState<SelectionTrackingData>({
        nonDefaultSelections: [],
        startTimestamp: Date.now(),
    });

    const timeStorageKey = `pageTracking_time_${selectName}`;
    const selectionStorageKey = `pageTracking_selections_${selectName}`;
    const EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Initialize tracking data from localStorage
    useEffect(() =>
    {
        const currentTime = Date.now();

        // Initialize time data
        const storedTimeData = localStorage.getItem(timeStorageKey);
        if (storedTimeData)
        {
            const parsedTimeData: TimeTrackingData = JSON.parse(storedTimeData);
            const isTimeExpired = parsedTimeData.startTimestamp && (currentTime - parsedTimeData.startTimestamp) > EXPIRY_DURATION;

            if (!isTimeExpired)
            {
                setTimeData({
                    timeSpent: parsedTimeData.timeSpent || 0,
                    startTimestamp: parsedTimeData.startTimestamp || currentTime,
                });
            } else
            {
                const newTimeData = { timeSpent: 0, startTimestamp: currentTime };
                setTimeData(newTimeData);
                localStorage.setItem(timeStorageKey, JSON.stringify(newTimeData));
            }
        } else
        {
            const newTimeData = { timeSpent: 0, startTimestamp: currentTime };
            setTimeData(newTimeData);
            localStorage.setItem(timeStorageKey, JSON.stringify(newTimeData));
        }

        // Initialize selection data
        const storedSelectionData = localStorage.getItem(selectionStorageKey);
        if (storedSelectionData && !resetSelections)
        {
            const parsedSelectionData: SelectionTrackingData = JSON.parse(storedSelectionData);
            const isSelectionExpired = parsedSelectionData.startTimestamp && (currentTime - parsedSelectionData.startTimestamp) > EXPIRY_DURATION;

            if (!isSelectionExpired)
            {
                setSelectionData({
                    nonDefaultSelections: parsedSelectionData.nonDefaultSelections || [],
                    startTimestamp: parsedSelectionData.startTimestamp || currentTime,
                });
            } else
            {
                const newSelectionData = { nonDefaultSelections: [], startTimestamp: currentTime };
                setSelectionData(newSelectionData);
                localStorage.setItem(selectionStorageKey, JSON.stringify(newSelectionData));
            }
        } else
        {
            const newSelectionData = { nonDefaultSelections: [], startTimestamp: currentTime };
            setSelectionData(newSelectionData);
            localStorage.setItem(selectionStorageKey, JSON.stringify(newSelectionData));
        }
    }, [selectName, resetSelections]);

    // Track time spent on page
    useEffect(() =>
    {
        const interval = setInterval(() =>
        {
            setTimeData((prev) =>
            {
                const currentTime = Date.now();
                const isExpired = prev.startTimestamp && (currentTime - prev.startTimestamp) > EXPIRY_DURATION;
                if (isExpired)
                {
                    const newTimeData = { timeSpent: 0, startTimestamp: currentTime };
                    localStorage.setItem(timeStorageKey, JSON.stringify(newTimeData));
                    return newTimeData;
                }
                const newTimeSpent = prev.timeSpent + 1;
                const updatedData = { ...prev, timeSpent: newTimeSpent };
                localStorage.setItem(timeStorageKey, JSON.stringify(updatedData));
                return updatedData;
            });
        }, 1000); // Update every second

        return () => clearInterval(interval); // Cleanup on unmount
    }, [selectName]);

    // Function to handle select changes
    const handleSelectChange = useCallback((value: string) =>
    {
        if (value !== initialValue)
        {
            setSelectionData((prev) =>
            {
                const currentTime = Date.now();
                const isExpired = prev.startTimestamp && (currentTime - prev.startTimestamp) > EXPIRY_DURATION;
                if (isExpired)
                {
                    const newSelectionData = { nonDefaultSelections: [value], startTimestamp: currentTime };
                    localStorage.setItem(selectionStorageKey, JSON.stringify(newSelectionData));
                    return newSelectionData;
                }
                const newSelections = prev.nonDefaultSelections.includes(value)
                    ? prev.nonDefaultSelections
                    : [...prev.nonDefaultSelections, value];
                const updatedData = { ...prev, nonDefaultSelections: newSelections };
                localStorage.setItem(selectionStorageKey, JSON.stringify(updatedData));
                return updatedData;
            });
        }
    }, [initialValue, selectName]);

    // Function to get tracking data
    const getTrackingData = useCallback((): TrackingDataResult =>
    {
        const currentTime = Date.now();
        let result: TrackingDataResult;

        // Check time data
        const storedTimeData = localStorage.getItem(timeStorageKey);
        let currentTimeData = timeData;
        if (storedTimeData)
        {
            const parsedTimeData: TimeTrackingData = JSON.parse(storedTimeData);
            const isTimeExpired = parsedTimeData.startTimestamp && (currentTime - parsedTimeData.startTimestamp) > EXPIRY_DURATION;
            if (isTimeExpired)
            {
                const newTimeData = { timeSpent: 0, startTimestamp: currentTime };
                setTimeData(newTimeData);
                localStorage.setItem(timeStorageKey, JSON.stringify(newTimeData));
                currentTimeData = newTimeData;
            } else
            {
                setTimeData((prev) => ({
                    ...prev,
                    timeSpent: parsedTimeData.timeSpent || prev.timeSpent,
                    startTimestamp: parsedTimeData.startTimestamp || prev.startTimestamp,
                }));
                currentTimeData = {
                    timeSpent: parsedTimeData.timeSpent || timeData.timeSpent,
                    startTimestamp: parsedTimeData.startTimestamp || timeData.startTimestamp,
                };
            }
        }

        // Check selection data
        const storedSelectionData = localStorage.getItem(selectionStorageKey);
        let currentSelectionData = selectionData;
        if (storedSelectionData)
        {
            const parsedSelectionData: SelectionTrackingData = JSON.parse(storedSelectionData);
            const isSelectionExpired = parsedSelectionData.startTimestamp && (currentTime - parsedSelectionData.startTimestamp) > EXPIRY_DURATION;
            if (isSelectionExpired)
            {
                const newSelectionData = { nonDefaultSelections: [], startTimestamp: currentTime };
                setSelectionData(newSelectionData);
                localStorage.setItem(selectionStorageKey, JSON.stringify(newSelectionData));
                currentSelectionData = newSelectionData;
            } else
            {
                setSelectionData((prev) => ({
                    ...prev,
                    nonDefaultSelections: parsedSelectionData.nonDefaultSelections || prev.nonDefaultSelections,
                    startTimestamp: parsedSelectionData.startTimestamp || prev.startTimestamp,
                }));
                currentSelectionData = {
                    nonDefaultSelections: parsedSelectionData.nonDefaultSelections || selectionData.nonDefaultSelections,
                    startTimestamp: parsedSelectionData.startTimestamp || selectionData.startTimestamp,
                };
            }
        }

        result = {
            timeSpent: currentTimeData.timeSpent,
            nonDefaultSelections: currentSelectionData.nonDefaultSelections,
            hasMultipleNonDefaultSelections: currentSelectionData.nonDefaultSelections.length > 1,
        };

        return result;
    }, [timeData, selectionData, selectName]);

    // isTrackEligible func, if user has spent more than 15 seconds and made at least one non-default selection
    const isTrackEligible = (): boolean =>
    {
        const { timeSpent, nonDefaultSelections } = getTrackingData();
        return timeSpent > 15 && nonDefaultSelections.length > 0;
    };

    return { handleSelectChange, getTrackingData, isTrackEligible };
}