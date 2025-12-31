import { Group, List, Select, Slot, TextArea, TextInput, Image} from '@makeswift/runtime/controls';

import { runtime } from '~/lib/makeswift/runtime';

import { DescriptionSource, MakeswiftProductDetail } from './client';

export const COMPONENT_TYPE = 'catalyst-makeswift-product-detail-description';

const description = Group({
  label: 'Description',
  props: {
    source: Select({
      label: 'Source',
      options: [
        { label: 'Catalog (plain text)', value: DescriptionSource.CatalogPlainText },
        { label: 'Catalog (rich text)', value: DescriptionSource.CatalogRichText },
        { label: 'Custom', value: DescriptionSource.Custom },
      ],
      defaultValue: DescriptionSource.CatalogRichText,
    }),
    slot: Slot(),
  },
});

runtime.registerComponent(MakeswiftProductDetail, {
  type: COMPONENT_TYPE,
  label: 'MakeswiftProductDetail (private)',
  hidden: true,
  props: {
    summaryText: TextArea({
      label: 'Summary',
    }),
    description,
    accordions: List({
      label: 'Product info',
      type: Group({
        label: 'Product info section',
        props: {
          title: TextInput({ label: 'Title', defaultValue: 'Section' }),
          content: Slot(),
        },
      }),
      getItemLabel: (section) => section?.title || 'Section',
    }),
    benefitsList: List({
      label: "Benefits List",
      type: Group({
        label: 'Benefits Section',
        props: {
          icon: Image({
            label: "icon",
            format: Image.Format.URL,
          }),
          title: TextInput({ label: 'Title', defaultValue: 'Section' }),
        },
      }),
      getItemLabel: (section) => section?.title || 'Section',
    }),
  },
});
