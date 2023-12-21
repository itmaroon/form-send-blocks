import { useEffect } from '@wordpress/element';
import { useDeepCompareEffect } from './CustomFooks';
import { ServerStyleSheet } from 'styled-components';
import { renderToString } from 'react-dom/server';


export function useStyleIframe(StyleComp, attributes) {
  //サイトエディタの場合はiframeにスタイルをわたす。
  useDeepCompareEffect(() => {
    const iframeInstance = document.getElementsByName('editor-canvas')[0];

    if (iframeInstance) {
      const iframeDocument = iframeInstance.contentDocument || iframeInstance.contentWindow.document;
      const sheet = new ServerStyleSheet();
      renderToString(sheet.collectStyles(<StyleComp attributes={attributes} />));
      const styleTags = sheet.getStyleTags();
      const styleContent = styleTags.replace(/<style[^>]*>|<\/style>/g, '');

      const iframeStyleTag = iframeDocument.createElement('style');
      iframeStyleTag.innerHTML = styleContent;

      // Append the new style tag to the iframe's document head
      iframeDocument.head.appendChild(iframeStyleTag);
      // Return a cleanup function to remove the style tag
      return () => {
        iframeDocument.head.removeChild(iframeStyleTag);
      };
    }
  }, [attributes]);
}

export function useFontawesomeIframe() {
  //iframeにfontawesomeを読み込む
  useEffect(() => {
    const iframeInstance = document.getElementsByName('editor-canvas')[0];

    if (iframeInstance) {
      const iframeDocument = iframeInstance.contentDocument || iframeInstance.contentWindow.document;
      const scriptElement = iframeDocument.createElement("script");
      scriptElement.setAttribute("src", "../../../assets/fontawesome.js");
      //scriptElement.setAttribute("crossorigin", "anonymous");

      iframeDocument.body.appendChild(scriptElement);

      // Return a cleanup function to remove the script tag
      return () => {
        iframeDocument.body?.removeChild(scriptElement);
      };
    }
  }, []);
}

