const createRGB = (inputStr) => {
	//１６進数変換の関数
	function componentToHex(c) {
		const hex = parseInt(c, 10).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	}

	let resultStr;
	let rgb = [];

	// #000000 形式の場合
	if (/^#[0-9a-fA-F]{6}$/.test(inputStr)) {
		rgb = [
			inputStr.slice(1, 3),
			inputStr.slice(3, 5),
			inputStr.slice(5, 7)
		];
	}
	// rgb(0,0,0) 形式の場合
	else if ((resultStr = inputStr.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/))) {
		rgb = [
			componentToHex(resultStr[1]),
			componentToHex(resultStr[2]),
			componentToHex(resultStr[3])
		];
	} else {
		// サポートされていない形式の場合はデフォルトの値を設定する
		rgb = ["ff", "ff", "ff"];
	}
	return rgb;
}

export function hslToRgb16(hue, saturation, lightness) {
	var result = false;

	if (((hue || hue === 0) && hue <= 360) && ((saturation || saturation === 0) && saturation <= 100) && ((lightness || lightness === 0) && lightness <= 100)) {
		var red = 0,
			green = 0,
			blue = 0,
			q = 0,
			p = 0,
			hueToRgb;

		hue = Number(hue) / 360;
		saturation = Number(saturation) / 100;
		lightness = Number(lightness) / 100;

		if (saturation === 0) {
			red = lightness;
			green = lightness;
			blue = lightness;
		} else {
			hueToRgb = function (p, q, t) {
				if (t < 0) t += 1;
				if (t > 1) t -= 1;

				if (t < 1 / 6) {
					p += (q - p) * 6 * t;
				} else if (t < 1 / 2) {
					p = q;
				} else if (t < 2 / 3) {
					p += (q - p) * (2 / 3 - t) * 6;
				}

				return p;
			};

			if (lightness < 0.5) {
				q = lightness * (1 + saturation);
			} else {
				q = lightness + saturation - lightness * saturation;
			}
			p = 2 * lightness - q;

			red = hueToRgb(p, q, hue + 1 / 3);
			green = hueToRgb(p, q, hue);
			blue = hueToRgb(p, q, hue - 1 / 3);
		}

		result = `#${Math.round(red * 255).toString(16).padStart(2, '0')}${Math.round(green * 255).toString(16).padStart(2, '0')}${Math.round(blue * 255).toString(16).padStart(2, '0')}`;

	}

	return result;
};

export function rgb16ToHsl(strRgb16) {
	let rgb = createRGB(strRgb16);
	let red = rgb[0];
	let green = rgb[1];
	let blue = rgb[2];
	let result = false;

	if (((red || red === 0) && String(red).match(/^[0-9a-f]{2}$/i)) && ((green || green === 0) && String(green).match(/^[0-9a-f]{2}$/i)) && ((blue || blue === 0) && String(blue).match(/^[0-9a-f]{2}$/i))) {
		let hue = 0,
			saturation = 0,
			lightness = 0,
			max = 0,
			min = 0,
			diff = 0;

		red = parseInt(red, 16) / 255;
		green = parseInt(green, 16) / 255;
		blue = parseInt(blue, 16) / 255;
		max = Math.max(red, green, blue);
		min = Math.min(red, green, blue);
		lightness = (max + min) / 2;

		if (max !== min) {
			diff = max - min;

			if (lightness > 0.5) {
				saturation = diff / (2 - max - min);
			} else {
				saturation = diff / (max + min);
			}

			if (max === red) {
				hue = (green - blue) / diff;
			} else if (max === green) {
				hue = 2 + (blue - red) / diff;
			} else {
				hue = 4 + (red - green) / diff;
			}

			hue /= 6;
		}

		result = {
			hue: Math.round(hue * 360),
			saturation: Math.round(saturation * 100),
			lightness: Math.round(lightness * 100)
		};
	}

	return result;
};

export function HexToRGB(strRgb16) {
	let rgb = createRGB(strRgb16);
	let red = rgb[0];
	let green = rgb[1];
	let blue = rgb[2];
	let result = false;

	if (((red || red === 0) && String(red).match(/^[0-9a-f]{2}$/i)) && ((green || green === 0) && String(green).match(/^[0-9a-f]{2}$/i)) && ((blue || blue === 0) && String(blue).match(/^[0-9a-f]{2}$/i))) {


		red = parseInt(red, 16);
		green = parseInt(green, 16);
		blue = parseInt(blue, 16);


		result = {
			red: Math.round(red),
			green: Math.round(green),
			blue: Math.round(blue)
		};
	}

	return result;
};