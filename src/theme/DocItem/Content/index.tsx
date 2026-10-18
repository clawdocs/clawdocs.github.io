import React from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import CiVerified from '@site/src/components/CiVerified';

type Props = WrapperProps<typeof ContentType>;

// Shows the "Verified in CI" pill above pages whose front matter has
// `ci_verified: { version, date, steps }`.
export default function ContentWrapper(props: Props): React.ReactElement {
  const {frontMatter} = useDoc();
  const data = (frontMatter as Record<string, unknown>).ci_verified;
  return (
    <>
      {data ? <CiVerified data={data} /> : null}
      <Content {...props} />
    </>
  );
}
