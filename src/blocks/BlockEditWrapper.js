import { Suspense } from '@wordpress/element';

function BlockEditWrapper({ lazyComponent: LazyComponent, ...props }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

export default BlockEditWrapper;