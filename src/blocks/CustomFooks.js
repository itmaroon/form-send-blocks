import { useRef, useEffect, useState } from '@wordpress/element';
import isEqual from 'lodash/isEqual';

//useRefで参照したDOM要素の大きさを取得するカスタムフック
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return [ref, width];
}

//ブロックの背景色を取得するカスタムフック
export function useElementBackgroundColor(blockRef, style) {
  const [baseColor, setBaseColor] = useState('');

  useEffect(() => {
    if (blockRef.current && style) {
      if (style.backgroundColor && !style.backgroundColor.startsWith("var(--wp")) {//backgroundColorが設定されており、それがカスタムプロパティでない
        setBaseColor(style.backgroundColor);
      } else {//レンダリング結果から背景色を取得
        if (blockRef.current) {
          const computedStyles = getComputedStyle(blockRef.current);
          setBaseColor(computedStyles.backgroundColor);
        }
      }
    }

  }, [style, blockRef]);

  return baseColor;
}

//ViewPortの大きさでモバイルを判断(767px以下がモバイル)するカスタムフック
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 767);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return isMobile;
};

export function useIsIframeMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // iframeのcontentWindowを監視する関数
    const checkIframeSize = () => {
      const iframeInstance = document.getElementsByName('editor-canvas')[0];
      if (iframeInstance && iframeInstance.contentWindow) {
        setIsMobile(iframeInstance.contentWindow.innerWidth <= 767);
      }
    };

    // iframeのcontentWindowのリサイズイベントにリスナーを追加
    const iframeInstance = document.getElementsByName('editor-canvas')[0];
    if (iframeInstance && iframeInstance.contentWindow) {
      iframeInstance.contentWindow.addEventListener('resize', checkIframeSize);
    }

    // 初期チェックを実行
    checkIframeSize();

    // クリーンアップ関数
    return () => {
      if (iframeInstance && iframeInstance.contentWindow) {
        iframeInstance.contentWindow.removeEventListener('resize', checkIframeSize);
      }
    };
  }, []);

  return isMobile;
}


//たくさんの要素をもつオブジェクトや配列の内容の変化で発火するuseEffect
export function useDeepCompareEffect(callback, dependencies) {
  const dependenciesRef = useRef();

  if (!isEqual(dependencies, dependenciesRef.current)) {
    dependenciesRef.current = dependencies;
  }

  useEffect(() => {
    return callback();
  }, [dependenciesRef.current]);
}
