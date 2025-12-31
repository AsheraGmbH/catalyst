'use client';

import { useTranslations } from 'next-intl';
import useSWR from 'swr';

export const AddToCartCounterComponent = ({ count } : {
    count: number;
}) => {
    const t = useTranslations('Components.AddToCartCounter');
    return (
        <div className='flex items-center gap-x-4 md:gap-x-2 pt-4'>
            <div className="flex -space-x-4 rtl:space-x-reverse">
                <img className="w-8 h-8 border-2 border-white rounded-full dark:border-white" src="https://cdn.prod.website-files.com/674b7ff490cde09550bdb125/67e5bfc2f3465dc4d717a8ed_profile-picture-4.jpg" alt="" />
                <img className="w-8 h-8 border-2 border-white rounded-full dark:border-white" src="https://cdn.prod.website-files.com/674b7ff490cde09550bdb125/67e5bfc00dd1703d839a93a3_profile-picture-2.jpg" alt="" />
                <img className="w-8 h-8 border-2 border-white rounded-full dark:border-white" src="https://cdn.prod.website-files.com/674b7ff490cde09550bdb125/67e5bfc00ad3229ed24f6ce9_profile-picture-3.jpg" alt="" />
            </div>
            <p className='text-white text-xs lg:text-sm'>
                {t('moreThan')} <span className='font-bold'>{count}</span> {t('endText')}
            </p>
        </div>
    )
}

export const AddToCartCounter = () => {
    const { data, error } = useSWR('https://ashera-backend.ashera.workers.dev/get-event-count', async (url) =>
        fetch(url)
          .then((r) => r.json())
    );

    if (error) return <AddToCartCounterComponent count={20} />;
    if (!data) return <AddToCartCounterComponent count={20} />;

    return <AddToCartCounterComponent count={data} />
};
