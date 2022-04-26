const sketch = (s) => {
	const crMin = 3; // Minimum constrast ratio

	const ml = 60; // margin left
	const mt = 30; //margin bottom
	const mb = 36; //margin bottom
	const sc = 2.6; // scale factor
	let w;
	let h;
	let bgHue = 180;
	let bgSat = 50;
	let bgLig = 50;
	let img;
	let bgImg;
	let cnv;
	let txtColor = []; //color foreground
	let txtLumi; // luminance de txtColor
	let arrCr = [];
	let result = [];
	const reso = 10; // "résolution"
	let crScore;
	let colorGradient; // p5.createGraphics -> stocke l'image du dégradé de la couleur de fond
	let legend;
	let pattern;
	let theMask;
	let masked;
	let colorPickerBg;
	let colorPickerTxt;
	const notif = document.querySelector('.notif');

	s.setup = () => {
		w = 100 * sc;
		h = 100 * sc;
		cnv = s.createCanvas(w + ml + 20, h + mt + mb);

		colorPickerBg = document.querySelector('#colorBg');
		colorPickerTxt = document.querySelector('#colorTxt');

		// Création du pattern à rayures
		const tile_w = 40;
		const n_rows = 4;
		const tile = s.createGraphics(tile_w, tile_w)
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

		pattern = s.createGraphics(100 * sc, 100 * sc);
		pattern.drawingContext.fillStyle = pattern.drawingContext.createPattern(tile.canvas, 'repeat');
		pattern.drawingContext.fillRect(0, 0, 100 * sc, 100 * sc);

		theMask = s.createGraphics(100 * sc, 100 * sc);

		// Légende
		legend = s.createGraphics(w + ml + 20, h + mt + mb)
		legend.push();
		legend.translate(ml, mt);
		legend.textSize(10);
		legend.fill(90);
		legend.textAlign(s.CENTER);
		// abscisse
		for (let i = 0; i <= 10; i += 2) {
			legend.text(i * 10, (i * sc * 10), h + 12);
		}
		legend.textAlign(s.RIGHT);
		// ordonnée
		for (let i = 0; i <= 10; i += 2) {
			legend.text(100 - (i * 10), -6, (i * sc * 10) + 4);
		}
		legend.pop();
		legend.push();
		legend.textSize(14);
		legend.textAlign(s.CENTER);
		legend.text('Saturation', ml + w / 2, h + mt + 30)
		legend.translate(36, h / 2 + mt)
		legend.rotate(s.PI / -2.0)
		legend.text('Lightness', 0, 0);
		legend.pop();

		// Création de l'image de fond en fonction de la couleur 
		const clr = s.color(`hsl(${bgHue}, ${bgSat}%, ${bgLig}%)`);
		const clrHex = s.getHex(clr.levels.slice(0, 3));
		document.documentElement.style.setProperty('--samp-bg', `${clrHex}`);
		colorPickerBg.value = clrHex;

		colorGradient = s.createGraphics(100 * sc, 100 * sc);
		s.createColorGradient();

		cnv.mousePressed(s.updateBgColor);

		colorPickerBg.addEventListener('input', s.changeBgColor);

		colorPickerTxt.value = '#eeff00';
		colorPickerTxt.addEventListener('input', s.changeTxtColor);

		txtColor = s.color(colorPickerTxt.value).levels.slice(0, 3);
		document.documentElement.style.setProperty('--samp-clr', `rgb(${txtColor[0]}, ${txtColor[1]}, ${txtColor[2]})`);
		s.colorMode(s.RGB);

		crScore = document.querySelector('#score span:last-of-type');

		s.noLoop();

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
					await navigator.clipboard.writeText(val)
						.then(() => s.notif("Hex value copied to clipboard."))
						.catch((err) => s.notif(`Error while copying to clipboard : ${err}`))
				} else {
					console.log("go fuck yourself!")
				}
			}
		}, false);
	}


	s.draw = () => {
		// put drawing code here
		cnv.clear();
		s.image(legend, 0, 0);
		s.image(colorGradient, ml, mt);
		s.traceZone();
		s.drawColorCircle();
	}

	s.changeTxtColor = () => {
		txtColor = s.color(colorPickerTxt.value).levels.slice(0, 3);
		document.documentElement.style.setProperty('--samp-clr', `rgb(${txtColor[0]}, ${txtColor[1]}, ${txtColor[2]})`);

		s.redraw();
	}

	s.changeBgColor = (ev) => {
		const newCol = s.color(colorPickerBg.value); // '#rrggbb'
		const newHue = Math.round(s.hue(newCol));
		bgSat = Math.round(s.saturation(newCol));
		bgLig = Math.round(s.lightness(newCol));
		document.documentElement.style.setProperty('--samp-bg', colorPickerBg.value);
		if (newHue !== bgHue) {
			bgHue = newHue;
			s.createColorGradient();
		}

		s.redraw();
	}

	s.updateBgColor = () => {
		s.colorMode(s.RGB);
		let _x = (s.mouseX - ml) / sc;
		let _y = (s.mouseY - mt) / sc;
		if (_x < 0) _x = 0;
		if (_y < 0) _y = 0;
		if (_x > 99) _x = 99;
		if (_y > 99) _y = 99;
		let p = img.get(_x, _y);
		p = p.slice(0, 3); // array [R,G,B] on ignore la transparence
		const col = s.color(`rgb(${p.join(',')})`);
		colorPickerBg.value = s.getHex(p); // Valeur hex (input[type='color'].value doit être de la forme '#rrggbb')
		document.documentElement.style.setProperty('--samp-bg', colorPickerBg.value);
		bgSat = Math.round(s.saturation(col));
		bgLig = Math.round(s.lightness(col));

		s.redraw();
	}

	s.createColorGradient = () => {
		// Création de l'image de fond en fonction de la couleur 
		colorGradient.clear();
		img = s.createImage(100, 100);
		img.loadPixels();
		for (let i = 0; i < img.width; i++) {
			for (let j = 0; j < img.height; j++) {
				s.colorMode(s.HSL, 360, 100, 100, 1);
				img.set(i, j, s.color(`hsl(${bgHue}, ${i}%, ${100 - j}%)`));
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

	s.drawColorCircle = () => {
		// Cercle la couleur sélectionnée (bg color)
		s.push();
		const xCircle = (bgSat * sc) + ml;
		const yCircle = ((100 - bgLig) * sc) + mt;
		s.drawingContext.shadowOffsetX = 0;
		s.drawingContext.shadowOffsetY = 0;
		s.drawingContext.shadowBlur = 2;
		s.drawingContext.shadowColor = 'black';
		s.stroke('#fff');
		s.strokeWeight(2);
		s.fill(0, 0, 0, 0);
		s.circle(xCircle, yCircle, 8);
		s.pop();
	}

	s.traceZone = () => {
		s.push();
		s.translate(ml, mt)
		// Luminosité couleur de premier plan (colorPickerTxt)
		txtLumi = s.colorLuminance(txtColor);
		// calcul et affichage du contrast ratio de fg & bg col
		s.colorMode(s.HSL, 360, 100, 100, 1);
		const bc = s.color(`hsl(${bgHue}, ${bgSat}%, ${bgLig}%)`);
		const lumiBg = s.colorLuminance([s.red(bc), s.green(bc), s.blue(bc)]);
		const myCr = s.calcContrastRatio(lumiBg, txtLumi);
		crScore.innerHTML = `${myCr.toFixed(2)}`;
		if (myCr >= crMin) {
			crScore.classList.remove('cr_bad');
			crScore.classList.add('cr_ok');
		} else {
			crScore.classList.remove('cr_ok');
			crScore.classList.add('cr_bad');
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
				l = s.colorLuminance(c.slice(0, 3));
				arrCr[j][i] = s.calcContrastRatio(l, txtLumi);
			}
		}
		// console.log(arrCr)

		// Calcul de la valeur de chaque carré
		let sample = [];
		// va stocker  les resultats de la colonne du milieu pour pouvoir définir les zones d'exclusion ensuite
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
		s.stroke(255, 0, 255)
		let d = (reso * sc) / 2;
		for (let i = 0; i < result.length; i++) {
			for (let j = 0; j < result[0].length; j++) {
				if (result[i][j] > 0) {
					let x1, y1, x2, y2;
					// lerp : entre les points CR > crMin et CR < crMin
					switch (result[i][j]) {
						case 1:
							x1 = j * reso * sc;
							y1 = s.myLerp(i + 1, i, arrCr[i + 1][j], arrCr[i][j]);
							y2 = (i + 1) * reso * sc;
							x2 = s.myLerp(j, j + 1, arrCr[i + 1][j], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 2:
							x1 = s.myLerp(j + 1, j, arrCr[i + 1][j + 1], arrCr[i + 1][j]);
							y1 = (i + 1) * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = s.myLerp(i + 1, i, arrCr[i + 1][j + 1], arrCr[i][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 3:
							x1 = j * reso * sc;
							y1 = s.myLerp(i + 1, i, arrCr[i + 1][j], arrCr[i][j]);
							x2 = (j + 1) * reso * sc;
							y2 = s.myLerp(i + 1, i, arrCr[i + 1][j + 1], arrCr[i][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 4:
							x1 = s.myLerp(j + 1, j, arrCr[i][j + 1], arrCr[i][j]);
							y1 = i * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = s.myLerp(i, i + 1, arrCr[i][j + 1], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 5:
							// 2 lignes
							break;
						case 6:
							x1 = s.myLerp(j + 1, j, arrCr[i][j + 1], arrCr[i][j]);
							y1 = i * reso * sc;
							x2 = s.myLerp(j + 1, j, arrCr[i + 1][j + 1], arrCr[i + 1][j]);
							y2 = (i + 1) * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 7:
							x1 = j * reso * sc;
							y1 = s.myLerp(i + 1, i, arrCr[i + 1][j], arrCr[i][j]);
							x2 = s.myLerp(j + 1, j, arrCr[i][j + 1], arrCr[i][j]);
							y2 = i * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 8:
							x1 = j * reso * sc;
							y1 = s.myLerp(i, i + 1, arrCr[i][j], arrCr[i + 1][j]);
							x2 = s.myLerp(j, j + 1, arrCr[i][j], arrCr[i][j + 1]);
							y2 = i * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 9:
							if ((i - 1) > 0 && arrLerps[i - 1][j] !== null) {
								x1 = arrLerps[i - 1][j][1].x;
								y1 = arrLerps[i - 1][j][1].y;
							} else {
								x1 = s.myLerp(j, j + 1, arrCr[i][j], arrCr[i][j + 1]);
								y1 = i * reso * sc;
							}
							x2 = s.myLerp(j, j + 1, arrCr[i + 1][j], arrCr[i + 1][j + 1]);
							y2 = (i + 1) * reso * sc;
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 10:
							// 2 lignes
							break;
						case 11:
							x1 = s.myLerp(j, j + 1, arrCr[i][j], arrCr[i][j + 1]);
							y1 = i * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = s.myLerp(i + 1, i, arrCr[i + 1][j + 1], arrCr[i][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 12:
							x1 = j * reso * sc;
							y1 = s.myLerp(i, i + 1, arrCr[i][j], arrCr[i + 1][j]);
							x2 = (j + 1) * reso * sc;
							y2 = s.myLerp(i, i + 1, arrCr[i][j + 1], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 13:
							x1 = s.myLerp(j, j + 1, arrCr[i + 1][j], arrCr[i + 1][j + 1]);
							y1 = (i + 1) * reso * sc;
							x2 = (j + 1) * reso * sc;
							y2 = s.myLerp(i, i + 1, arrCr[i][j + 1], arrCr[i + 1][j + 1]);
							arrLerps[i][j] = [{ x: x1, y: y1 }, { x: x2, y: y2 }]
							break;
						case 14:
							x1 = j * reso * sc;
							y1 = s.myLerp(i, i + 1, arrCr[i][j], arrCr[i + 1][j]);
							x2 = s.myLerp(j + 1, j, arrCr[i + 1][j + 1], arrCr[i + 1][j]);
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
		// Création d'un cretaGraphics pour dessiner la forme (et s'en servir de masque sur le pattern enssuite)
		theMask.clear();
		theMask.noStroke()
		theMask.fill('rgba(255,0,255,1)');
		theMask.beginShape();
		if (ligne2.length < 1) {
			// 1 seule ligne
			if (/^X+[0-9]+0*$/.test(zones)) {
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
				theMask.endShape(s.CLOSE);
				theMask.beginShape();
				ligne2.forEach(v => theMask.vertex(v.x, v.y));
				theMask.vertex(100 * sc, 100 * sc);
				theMask.vertex(0, 100 * sc);
			}
		}
		theMask.endShape(s.CLOSE);
		// apply mask
		(masked = pattern.get()).mask(theMask);
		s.drawingContext.filter = 'opacity(30%)';
		s.image(masked, 0, 0)
		s.pop();
	}


	// Utils fonctions

	// param: array [R, G, B]
	s.colorLuminance = (rgb) => {
		let lumi = rgb.map(v => {
			v /= 255;
			return (v < 0.03928) ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
		})
		return (lumi[0] * 0.2126) + (lumi[1] * 0.7152) + (lumi[2] * 0.0722);
	}

	s.calcContrastRatio = (lum1, lum2) => {
		// lightest color over darkest
		return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
	}

	// start: position (x ou y) du point dont le CR > crMin
	// end: position (x ou y) du point dont le CR < crMin
	s.myLerp = (start, end, crStart, crEnd) => {
		start = start * reso * sc;
		end = end * reso * sc;
		return start + (crMin - crStart) * ((end - start) / (crEnd - crStart));
	}

	s.getHex = (rgb) => {
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

	s.notif = (message) => {
		notif.innerText = message;
		notif.classList.add('visible');
		notif.addEventListener('transitionend', s.notifDown, {once: true}, false)
		notif.addEventListener('transitioncancel', s.notifDown, {once: true}, false)
	}

	s.notifDown = () => {
		notif.classList.remove('visible');
		notif.removeEventListener('transitionend', s.notifDown);
	}
}

window.addEventListener("load", e => {
	const myP5 = new p5(sketch);
});