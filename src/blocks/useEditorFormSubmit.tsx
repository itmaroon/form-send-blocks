/**
 * エディタ内でフォームの submit を横取りするフック。
 *
 * 【重要】@wordpress/element に依存するため、ビュースクリプトから読まれる
 * front_common とは分けてある。両者を同居させると、フォーム系ブロックの
 * view.asset.php に wp-element が書き出され、訪問者に React が配信される。
 */
import { useEffect, useRef } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

type UpdateBlockAttributes = (
	clientId: string,
	attributes: Record<string, unknown>,
) => void;

type UsePreventEditorFormSubmitParams = {
	parentClientId: string;
	currentStep: number;
	updateBlockAttributes: UpdateBlockAttributes;
	forwardKey?: string;
	backKey?: string;
};

//onSubmitを早期に処理するフック
export const usePreventEditorFormSubmit = ({
	parentClientId,
	currentStep,
	updateBlockAttributes,
}: UsePreventEditorFormSubmitParams) => {
	const formRef = useRef<HTMLFormElement | null>(null);

	useEffect(() => {
		const form = formRef.current;

		if (!form) {
			return;
		}

		const handleNativeSubmit = (event: SubmitEvent) => {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			const submitter = event.submitter as HTMLElement | null;
			const clickId = submitter?.dataset.key;
			const pageDirection = submitter?.dataset.back;

			//押されたボタンがバックボタンの時
			if (pageDirection === "back") {
				if (!currentStep) return; //currentStep未設定なら抜ける
				updateBlockAttributes(parentClientId, {
					current_step: currentStep - 1,
				});

				return;
			}

			//押されたボタンがフォワードボタンの時
			if (pageDirection === "forward") {
				updateBlockAttributes(parentClientId, {
					current_step: currentStep + 1,
				});

				return;
			}
			//通常ボタンの時はclickIdを見る
			if (!clickId) {
				//submitボタンにkeyがないとき
				updateBlockAttributes(parentClientId, { current_step: 0 });
			} else {
				updateBlockAttributes(parentClientId, {
					current_step: currentStep + 1,
				});
			}
		};

		form.addEventListener("submit", handleNativeSubmit, true);

		return () => {
			form.removeEventListener("submit", handleNativeSubmit, true);
		};
	}, [parentClientId, currentStep, updateBlockAttributes]);

	return formRef;
};
