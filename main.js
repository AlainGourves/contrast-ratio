import './scss/style.scss'
import p5 from 'p5';

new p5(function (p5) {
	let crMin = 3; // Minimum constrast ratio

	const ml = 60; // margin left
	const mr = 20; // margin right
	const mt = 30; //margin bottom
	const mb = 36; //margin bottom
	const sc = 2.6; // scale factor
	let w;
	let h;
	let bgHue = 180;
	let bgSat = 50;
	let bgLig = 50;
	let img;
	let cnv;
	let txtColor = []; //color foreground
	let txtLumi; // luminance de txtColor
	let arrCr = [];
	let result = [];
	const reso = 10; // "résolution"
	let crScore;
	let crLevel;
	let colorGradient; // p5.createGraphics -> stocke l'image du dégradé de la couleur de fond
	let legend;
	let pattern;
	let theMask;
	let masked;
	let colorPickerBg;
	let colorPickerTxt;
	let sampleDiv;
	const notif = document.querySelector('.notif');

	p5.setup = () => {
		w = 100 * sc;
		h = 100 * sc;

		document.documentElement.style.setProperty('--cnv-ml', `${ml}px`);
		document.documentElement.style.setProperty('--cnv-mt', `${mt}px`);
		document.documentElement.style.setProperty('--cnv-w', `${w}px`);
		document.documentElement.style.setProperty('--cnv-w-tot', `${w + ml + mr}px`);
		document.documentElement.style.setProperty('--cnv-h-tot', `${h + mt + mb}px`);

		cnv = p5.createCanvas(w + ml + mr, h + mt + mb);
		cnv.parent(document.querySelector('#canvas'));

		colorPickerBg = document.querySelector('#colorBg');
		colorPickerTxt = document.querySelector('#colorTxt');

		// Création du pattern à rayures
		const tile_w = 40;
		const n_rows = 4;
		const tile = p5.createGraphics(tile_w, tile_w)
		const gradient = tile.drawingContext.createLinearGradient(0, 0, tile_w, tile_w);
		for (let i = 0; i < (2 * n_rows); i++) {
			if (i % 2) {
				gradient.addColorStop(i / (2 * n_rows), 'rgb(255,0,0)');
				gradient.addColorStop(i / (2 * n_rows), 'transparent');
			} else {
				gradient.addColorStop(i / (2 * n_rows), 'transparent');
				gradient.addColorStop(i / (2 * n_rows), 'rgb(255,0,0)');
			}

		}
		tile.drawingContext.fillStyle = gradient;
		tile.drawingContext.fillRect(0, 0, tile_w, tile_w);

		pattern = p5.createGraphics(100 * sc, 100 * sc);
		pattern.drawingContext.fillStyle = pattern.drawingContext.createPattern(tile.canvas, 'repeat');
		pattern.drawingContext.fillRect(0, 0, 100 * sc, 100 * sc);

		theMask = p5.createGraphics(100 * sc, 100 * sc);

		// Légende
		legend = p5.createGraphics(w + ml + mr, h + mt + mb)
		legend.push();
		legend.translate(ml, mt);
		legend.textSize(10);
		legend.fill(90);
		legend.textAlign(p5.CENTER);
		// abscisse
		for (let i = 0; i <= 10; i += 2) {
			legend.text(i * 10, (i * sc * 10), h + 12);
		}
		legend.textAlign(p5.RIGHT);
		// ordonnée
		for (let i = 0; i <= 10; i += 2) {
			legend.text(100 - (i * 10), -6, (i * sc * 10) + 4);
		}
		legend.pop();
		legend.push();
		legend.textSize(14);
		legend.textAlign(p5.CENTER);
		legend.text('Saturation', ml + w / 2, h + mt + 30)
		legend.translate(36, h / 2 + mt)
		legend.rotate(p5.PI / -2.0)
		legend.text('Lightness', 0, 0);
		legend.pop();

		// Création de l'image de fond en fonction de la couleur
		let clrHex = localStorage.getItem('bgColor');
		if (clrHex && /^\#[0-9a-f]{6}$/i.test(clrHex)) {
			let clr = p5.color(clrHex);
			bgHue = Math.round(p5.hue(clr));
			bgSat = Math.round(p5.saturation(clr));
			bgLig = Math.round(p5.lightness(clr))
		} else {
			let clr = p5.color(`hsl(${bgHue}, ${bgSat}%, ${bgLig}%)`);
			clrHex = p5.getHex(clr.levels.slice(0, 3));
		}
		document.documentElement.style.setProperty('--samp-bg', `${clrHex}`);
		colorPickerBg.value = clrHex;

		colorGradient = p5.createGraphics(100 * sc, 100 * sc);
		p5.createColorGradient();

		cnv.mousePressed(p5.updateBgColor);

		colorPickerBg.addEventListener('input', p5.throttle((ev) => p5.changeBgColor(ev), 100));
		colorPickerBg.addEventListener('change', ev => {
			// Stocke la valeur en localStorage
			localStorage.setItem('bgColor', ev.target.value);
		});

		let clr = localStorage.getItem('txtColor');
		colorPickerTxt.value = (clr && /^\#[0-9a-f]{6}$/i.test(clr)) ? clr : '#eeff00';
		colorPickerTxt.addEventListener('input', p5.throttle(() => p5.changeTxtColor(), 100));
		colorPickerTxt.addEventListener('change', ev => {
			// Stocke la valeur en localStorage
			localStorage.setItem('txtColor', ev.target.value);
		});

		txtColor = p5.color(colorPickerTxt.value).levels.slice(0, 3);
		document.documentElement.style.setProperty('--samp-clr', `rgb(${txtColor[0]}, ${txtColor[1]}, ${txtColor[2]})`);
		p5.colorMode(p5.RGB);

		sampleDiv = document.querySelector('#sample');
		const theSizeSwitch = document.querySelector('#switch-size');
		const switchSize = (ev) => {
			if ((ev.target.checked)) {
				sampleDiv.firstElementChild.classList.remove('normal');
				sampleDiv.firstElementChild.classList.add('large');
				crMin = 3;
			} else {
				sampleDiv.firstElementChild.classList.add('normal');
				sampleDiv.firstElementChild.classList.remove('large');
				crMin = 4.5;
			}
			p5.redraw();
		}
		theSizeSwitch.addEventListener('change', switchSize);
		theSizeSwitch.addEventListener('keydown', ev => {
			if (ev.key === 'Enter') {
				ev.target.checked = !ev.target.checked;
				switchSize(ev);
			}
		})

		crScore = document.querySelector('#score > span:nth-of-type(2)');
		crLevel = document.querySelector('#score > span:last-of-type');

		const colorBlindness = document.querySelector('#color-blindness');
		colorBlindness.selectedIndex = 0;
		colorBlindness.addEventListener('change', ev => {
			sampleDiv.classList.remove(...sampleDiv.classList); // vide classList
			const cb = ev.target.value;
			if (!cb) return
			sampleDiv.classList.add(`${cb}`);
		})

		// pas de loop, l'image n'est créée qu'au besoin par des appels à redraw()
		// et draw() n'est appelé qu'une fois, au début
		p5.noLoop();

		const inputs = document.querySelector('#inputs');

		inputs.addEventListener('click', async ev => {
			let el = ev.target;
			while (el && el.tagName !== 'BUTTON') {
				if (el === ev.currentTarget) break;
				el = el.parentNode;
			}
			if (el && el !== ev.currentTarget) {
				const val = el.closest('div').querySelector('input[type="color"]').value;
				if (navigator?.clipboard?.writeText) {
					// NB: on IOS, the API is limited to secured context (i.E https)
					// -> https://webkit.org/blog/10855/async-clipboard-api/
					await navigator.clipboard.writeText(val)
						.then(() => p5.notif("Hex value copied to clipboard."))
						.catch((err) => p5.notif(`Error while copying to clipboard : ${err}`))
				} else {
					let i = document.createElement('input');
					i.style.position = 'absolute';
					i.style.right = '100vh';
					i.style.bottom = '0';
					i.style.opacity = '0';
					i.value = val;
					document.body.appendChild(i);
					i.focus();
					i.setSelectionRange(0, i.value.length);
					document.execCommand('Copy');
					i.remove();
					p5.notif("Hex value copied to clipboard.")
				}
			}
		}, false);
	}

	p5.draw = () => {
		// put drawing code here
		cnv.clear();
		p5.image(legend, 0, 0);
		p5.image(colorGradient, ml, mt);
		p5.traceZone();
		p5.drawColorCircle();
	}

	// Fonction pour limiter le nombre d'appels à changeBgColor() ou changeTextColor()
	// limité à un appel toutes les 100ms
	// cf. https://redd.one/blog/debounce-vs-throttle
	p5.throttle = (callback, duration) => {
		let shouldWait = false;
		return (...args) => {
			if (shouldWait) return;
			callback.apply(null, args);
			shouldWait = true;

			setTimeout(() => {
				shouldWait = false;
			}, duration);
		}
	}

	p5.changeTxtColor = () => {
		txtColor = p5.color(colorPickerTxt.value).levels.slice(0, 3);
		document.documentElement.style.setProperty('--samp-clr', `rgb(${txtColor[0]}, ${txtColor[1]}, ${txtColor[2]})`);

		p5.redraw();
	}

	p5.changeBgColor = (ev) => {
		const newCol = p5.color(colorPickerBg.value); // '#rrggbb'
		const newHue = Math.round(p5.hue(newCol));
		bgSat = Math.round(p5.saturation(newCol));
		bgLig = Math.round(p5.lightness(newCol));
		document.documentElement.style.setProperty('--samp-bg', colorPickerBg.value);
		if (newHue !== bgHue) {
			bgHue = newHue;
			p5.createColorGradient();
		}

		p5.redraw();
	}

	p5.updateBgColor = () => {
		p5.colorMode(p5.RGB);
		let _x = (p5.mouseX - ml) / sc;
		let _y = (p5.mouseY - mt) / sc;
		if (_x < 0) _x = 0;
		if (_y < 0) _y = 0;
		if (_x > 99) _x = 99;
		if (_y > 99) _y = 99;
		let p = img.get(_x, _y);
		p = p.slice(0, 3); // array [R,G,B] on ignore la transparence
		const col = p5.color(`rgb(${p.join(',')})`);
		colorPickerBg.value = p5.getHex(p); // Valeur hex (input[type='color'].value doit être de la forme '#rrggbb')
		document.documentElement.style.setProperty('--samp-bg', colorPickerBg.value);
		bgSat = Math.round(p5.saturation(col));
		bgLig = Math.round(p5.lightness(col));

		p5.redraw();
	}

	p5.createColorGradient = () => {
		// Création de l'image de fond en fonction de la couleur
		colorGradient.clear();
		img = p5.createImage(100, 100);
		img.loadPixels();
		for (let i = 0; i < img.width; i++) {
			for (let j = 0; j < img.height; j++) {
				p5.colorMode(p5.HSL, 360, 100, 100, 1);
				img.set(i, j, p5.color(`hsl(${bgHue}, ${i}%, ${100 - j}%)`));
			}
		}
		img.updatePixels();
		// copie img en le mettant aux dimensions du canvas;
		colorGradient.copy(img, 0, 0, 100, 100, 0, 0, 100 * sc, 100 * sc);

		// Quadrillage
		colorGradient.stroke('rgba(255, 255, 255, .25)');
		for (let i = 1; i < 10; i++) {
			// lignes vert
			colorGradient.line((i * sc * 10), 0, (i * sc * 10), h);
		}
		for (let i = 1; i < 10; i++) {
			// lignes horiz
			colorGradient.line(0, (i * sc * 10), w, (i * sc * 10));
		}
	}

	p5.drawColorCircle = () => {
		// Cercle la couleur sélectionnée (bg color)
		p5.push();
		const xCircle = (bgSat * sc) + ml;
		const yCircle = ((100 - bgLig) * sc) + mt;
		p5.drawingContext.shadowOffsetX = 0;
		p5.drawingContext.shadowOffsetY = 0;
		p5.drawingContext.shadowBlur = 2;
		p5.drawingContext.shadowColor = 'black';
		p5.stroke('#fff');
		p5.strokeWeight(2);
		p5.fill(0, 0, 0, 0);
		p5.circle(xCircle, yCircle, 8);
		p5.pop();
	}

	p5.traceZone = () => {
		p5.push();
		p5.translate(ml, mt)
		// Luminosité couleur de premier plan (colorPickerTxt)
		txtLumi = p5.colorLuminance(txtColor);
		// calcul et affichage du contrast ratio de fg & bg col
		p5.colorMode(p5.HSL, 360, 100, 100, 1);
		const bc = p5.color(`hsl(${bgHue}, ${bgSat}%, ${bgLig}%)`);
		const lumiBg = p5.colorLuminance([p5.red(bc), p5.green(bc), p5.blue(bc)]);
		const myCr = p5.calcContrastRatio(lumiBg, txtLumi);
		crScore.querySelector('span').innerHTML = `${myCr.toFixed(2)}`;
		if (myCr >= crMin) {
			crScore.classList.remove('cr_bad');
			crScore.classList.add('cr_ok');
			crLevel.innerHTML = ((crMin === 3 && myCr >= 4.5) || (crMin === 4.5 && myCr >= 7)) ? 'AAA Level' : 'AA Level';
		} else {
			crScore.classList.remove('cr_ok');
			crScore.classList.add('cr_bad');
			crLevel.innerHTML = '';
		}

		// Array pour stocker les points calculés par lerp
		let arrLerps = []
		for (let i = 0; i < (100 / reso); i++) {
			arrLerps[i] = [];
			for (let j = 0; j < (100 / reso); j++) {
				arrLerps[i][j] = null;
			}
		}

		// Array pour stocker les contrast ratio
		// TODO: c'est à ce niveau qu'on peut paralléliser (calcul des CR au niveau de chaque carré, en vérifiant à chaque fois que le calcul n'a pas déjà été fait)
		for (let j = 0; j <= (100 / reso); j++) { // lignes
			arrCr[j] = []
			for (let i = 0; i <= (100 / reso); i++) { //colonnes
				let c, l;
				if (i === (100 / reso) && j < (100 / reso)) {
					// récupère le dernier pixel de la  ligne (idx 99 et pas 100)
					c = img.get(99, j * reso);
				} else if (j === (100 / reso) && i < (100 / reso)) {
					// récupère le dernier pixel de la  colonne (idx 99 et pas 100)
					c = img.get(i * reso, 99);
				} else if (i === (100 / reso) && j === (100 / reso)) {
					// récupère le pixel du coin inférieur droit
					c = img.get(99, 99);
				} else {
					c = img.get(i * reso, j * reso);
				}
				l = p5.colorLuminance(c.slice(0, 3));
				arrCr[j][i] = p5.calcContrastRatio(l, txtLumi);
			}
		}
		// console.log(arrCr)

		// Calcul de la valeur de chaque carré
		let sample = [];
		// va stocker  les resultats de la colonne 2 pour pouvoir définir les zones d'exclusion ensuite
		for (let i = 0; i < (100 / reso); i++) {
			result[i] = []
			for (let j = 0; j < (100 / reso); j++) {
				let tot = 0;
				if (!!arrCr[i][j] && arrCr[i][j] >= crMin) tot += 8; // (0b1000)
				if (!!arrCr[i][j + 1] && arrCr[i][j + 1] >= crMin) tot += 4; // (0b0100)
				if (!!arrCr[i + 1][j + 1] && arrCr[i + 1][j + 1] >= crMin) tot += 2; // (0b0010)
				if (!!arrCr[i + 1][j] && arrCr[i + 1][j] >= crMin) tot += 1; // (0b0001)
				result[i][j] = (tot === 15) ? 'X' : tot; // pas besoin de considérer le cas 15, pas de ligne à tracer
				if (j === 2) {
					sample.push(result[i][j]);
				}
			}
		}
		// console.log(result)
		p5.stroke(255, 0, 255)
		let d = (reso * sc) / 2;
		for (let i = 0; i < result.length; i++) {
			for (let j = 0; j < result[0].length; j++) {
				if (result[i][j] > 0) {
					let x1, y1, x2, y2;
					// lerp : entre les points CR > crMin et CR < crMin
					switch (result[i][j]) {
						case 1:
							x1 = j * reso * sc;
							y1 = p5.myLerp(i + 1, i, arrCr[i + 1][j], arrCr[i][j]);
							y2 = (i + 1) * reso * sc;
							x2 = p5.myLerp(j, j + 1, arrCr[i + 1][j], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 2:
							x1 = p5.myLerp(j + 1, j, arrCr[i + 1][j + 1], arrCr[i + 1][j]);
							y1 = (i + 1) * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = p5.myLerp(i + 1, i, arrCr[i + 1][j + 1], arrCr[i][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 3:
							x1 = j * reso * sc;
							y1 = p5.myLerp(i + 1, i, arrCr[i + 1][j], arrCr[i][j]);
							x2 = (j + 1) * reso * sc;
							y2 = p5.myLerp(i + 1, i, arrCr[i + 1][j + 1], arrCr[i][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 4:
							x1 = p5.myLerp(j + 1, j, arrCr[i][j + 1], arrCr[i][j]);
							y1 = i * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = p5.myLerp(i, i + 1, arrCr[i][j + 1], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 5:
							// 2 lignes
							break;
						case 6:
							x1 = p5.myLerp(j + 1, j, arrCr[i][j + 1], arrCr[i][j]);
							y1 = i * reso * sc;
							x2 = p5.myLerp(j + 1, j, arrCr[i + 1][j + 1], arrCr[i + 1][j]);
							y2 = (i + 1) * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 7:
							x1 = j * reso * sc;
							y1 = p5.myLerp(i + 1, i, arrCr[i + 1][j], arrCr[i][j]);
							x2 = p5.myLerp(j + 1, j, arrCr[i][j + 1], arrCr[i][j]);
							y2 = i * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 8:
							x1 = j * reso * sc;
							y1 = p5.myLerp(i, i + 1, arrCr[i][j], arrCr[i + 1][j]);
							x2 = p5.myLerp(j, j + 1, arrCr[i][j], arrCr[i][j + 1]);
							y2 = i * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 9:
							if ((i - 1) > 0 && arrLerps[i - 1][j] !== null) {
								x1 = arrLerps[i - 1][j][1].x;
								y1 = arrLerps[i - 1][j][1].y;
							} else {
								x1 = p5.myLerp(j, j + 1, arrCr[i][j], arrCr[i][j + 1]);
								y1 = i * reso * sc;
							}
							x2 = p5.myLerp(j, j + 1, arrCr[i + 1][j], arrCr[i + 1][j + 1]);
							y2 = (i + 1) * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 10:
							// 2 lignes
							break;
						case 11:
							x1 = p5.myLerp(j, j + 1, arrCr[i][j], arrCr[i][j + 1]);
							y1 = i * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = p5.myLerp(i + 1, i, arrCr[i + 1][j + 1], arrCr[i][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 12:
							x1 = j * reso * sc;
							y1 = p5.myLerp(i, i + 1, arrCr[i][j], arrCr[i + 1][j]);
							x2 = (j + 1) * reso * sc;
							y2 = p5.myLerp(i, i + 1, arrCr[i][j + 1], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 13:
							x1 = p5.myLerp(j, j + 1, arrCr[i + 1][j], arrCr[i + 1][j + 1]);
							y1 = (i + 1) * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = p5.myLerp(i, i + 1, arrCr[i][j + 1], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 14:
							x1 = j * reso * sc;
							y1 = p5.myLerp(i, i + 1, arrCr[i][j], arrCr[i + 1][j]);
							x2 = p5.myLerp(j + 1, j, arrCr[i + 1][j + 1], arrCr[i + 1][j]);
							y2 = (i + 1) * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
					}
				}
			}
		}
		// console.log(arrLerps)
		// Créer un array des points de(s) ligne(s)
		let ligne1 = [];
		let ligne2 = [];
		let nextPt1 = {}; //stocke le point suivant sur la première ligne
		let nextPt2 = {}; //stocke le point suivant sur la 2e ligne (s'il y en a une)
		let startPoints = [];
		// Recherche du(des) points de départ (x:0)
		for (let i = 0; i < arrLerps.length; i++) {
			if (arrLerps[i][0] && arrLerps[i][0].length) {
				if (arrLerps[i][0][0].x === 0) {
					startPoints.push(arrLerps[i][0])
				}
			}
		}
		ligne1.push(startPoints[0][0]);
		nextPt1 = startPoints[0][1];
		if (startPoints.length > 1) {
			ligne2.push(startPoints[1][0]);
			nextPt2 = startPoints[1][1];
		}

		// Boucle sur arrLerps, colonne par colonne
		for (let i = 0; i < arrLerps[0].length; i++) {
			// récupère la colonne `i` du array, puis filtre les valeurs non nulles
			let bob = arrLerps.map(col => col[i]).filter(v => !!v)
			const getNextPoint1 = (arr) => {
				const found = arr.find(el => el[0].x === nextPt1.x && el[0].y === nextPt1.y);
				if (found) {
					ligne1.push(nextPt1);
					nextPt1 = found[1];
					getNextPoint1(arr);
				} else {
					return;
				}
			}
			const getNextPoint2 = (arr) => {
				const found = arr.find(el => el[0].x === nextPt2.x && el[0].y === nextPt2.y);
				if (found) {
					ligne2.push(nextPt2);
					nextPt2 = found[1];
					getNextPoint2(arr);
				} else {
					return;
				}
			}
			getNextPoint1(bob);
			getNextPoint2(bob);
		}

		// derniers points
		ligne1.push(nextPt1);
		// console.log('l1', ligne1)
		if (startPoints.length > 1) {
			ligne2.push(nextPt2);
			// console.log('l2', ligne2)
		}

		let zones = sample.join('');
		// console.log(`zones: ${zones}`)
		// Création d'un cretaGraphics pour dessiner la forme (et s'en servir de masque sur le pattern enssuite)
		theMask.clear();
		theMask.noStroke()
		theMask.fill('rgba(255,0,255,1)');
		theMask.beginShape();
		if (ligne2.length < 1) {
			// 1 seule ligne
			if (/^X*[0-9]+0*$/.test(zones)) {
				// zone à exclure en bas
				ligne1.forEach(v => theMask.vertex(v.x, v.y));
				theMask.vertex(100 * sc, 100 * sc);
				theMask.vertex(0, 100 * sc);
			} else {
				// zone à exclure en haut
				ligne1.forEach(v => theMask.vertex(v.x, v.y));
				theMask.vertex(100 * sc, 0);
				theMask.vertex(0, 0);
			}
		} else {
			if (/^X*[1-9]+0+[1-9]+X*$/.test(zones)) {
				// zone à exclure au centre
				ligne1.forEach(v => theMask.vertex(v.x, v.y));
				ligne2.reverse().forEach(v => theMask.vertex(v.x, v.y));
			} else {
				// Zones à exclure en haut et en bas
				ligne1.forEach(v => theMask.vertex(v.x, v.y));
				theMask.vertex(0, 100 * sc);
				theMask.vertex(0, 0);
				theMask.endShape(p5.CLOSE);
				theMask.beginShape();
				ligne2.forEach(v => theMask.vertex(v.x, v.y));
				theMask.vertex(100 * sc, 100 * sc);
				theMask.vertex(0, 100 * sc);
			}
		}
		theMask.endShape(p5.CLOSE);
		// apply mask
		(masked = pattern.get()).mask(theMask);
		p5.drawingContext.filter = 'opacity(30%)';
		p5.image(masked, 0, 0)
		p5.pop();
	}


	// Utils fonctions

	// param: array [R, G, B]
	p5.colorLuminance = (rgb) => {
		let lumi = rgb.map(v => {
			v /= 255;
			return (v < 0.03928) ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
		})
		return (lumi[0] * 0.2126) + (lumi[1] * 0.7152) + (lumi[2] * 0.0722);
	}

	p5.calcContrastRatio = (lum1, lum2) => {
		// lightest color over darkest
		return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
	}

	// start: position (x ou y) du point dont le CR > crMin
	// end: position (x ou y) du point dont le CR < crMin
	p5.myLerp = (start, end, crStart, crEnd) => {
		start = start * reso * sc;
		end = end * reso * sc;
		return start + (crMin - crStart) * ((end - start) / (crEnd - crStart));
	}

	p5.getHex = (rgb) => {
		// rgb : array [r,g,b] (0-255)
		let h = rgb[0] << 16;
		h = h | rgb[1] << 8;
		h = h | rgb[2];
		let response = `#${(h.toString(16).length === 5) ? '0' + h.toString(16) : h.toString(16)}`;
		if (response.length !== 7) {
			// si rgb = [0,0,0], response aura comme valeur '#0'
			response = response.padEnd(7, '0');
		}
		return response;
	}

	p5.notif = (message) => {
		notif.innerText = message;
		notif.classList.add('visible');
		notif.addEventListener('transitionend', p5.notifDown, { once: true }, false)
		notif.addEventListener('transitioncancel', p5.notifDown, { once: true }, false)
	}

	p5.notifDown = () => {
		notif.classList.remove('visible');
		notif.removeEventListener('transitionend', p5.notifDown);
	}
});