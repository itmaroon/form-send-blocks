import { useDeepCompareEffect } from "itmar-block-packages";
import { ServerStyleSheet } from "styled-components";
import { renderToString } from "react-dom/server";

export function useStyleIframe(StyleComp, attributes) {
	//サイトエディタの場合はiframeにスタイルをわたす。
	useDeepCompareEffect(() => {
		const iframeInstance = document.getElementsByName("editor-canvas")[0];

		//個別
		if (iframeInstance) {
			const iframeDocument =
				iframeInstance.contentDocument || iframeInstance.contentWindow.document;
			const sheet = new ServerStyleSheet();

			renderToString(
				sheet.collectStyles(<StyleComp attributes={attributes} />),
			);
			const styleTags = sheet.getStyleTags();
			const styleContent = styleTags.replace(/<style[^>]*>|<\/style>/g, "");
			const iframeStyleTag = iframeDocument.createElement("style");
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
