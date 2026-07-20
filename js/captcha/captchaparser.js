const captcha_parse = (imgarr) => {
  let captcha = "";
  for (let x = 1; x < 44; x++) {
    for (let y = 1; y < 179; y++) {
      const condition1 =
        imgarr[x][y - 1] === 255 &&
        imgarr[x][y] === 0 &&
        imgarr[x][y + 1] === 255;
      const condition2 =
        imgarr[x - 1][y] === 255 &&
        imgarr[x][y] === 0 &&
        imgarr[x + 1][y] === 255;
      const condition3 = imgarr[x][y] !== 255 && imgarr[x][y] !== 0;
      if (condition1 || condition2 || condition3) {
        imgarr[x][y] = 255;
      }
    }
  }
  for (let j = 30; j < 181; j += 30) {
    let matches = [];
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    for (let i = 0; i < chars.length; i++) {
      let match = 0;
      let black = 0;
      const ch = chars.charAt(i);
      for (let x = 0; x < 32; x++) {
        for (let y = 0; y < 30; y++) {
          let y1 = y + j - 30;
          let x1 = x + 12;
          const isMaskBlack = bitmaps.isBlack(ch, x, y);
          if (isMaskBlack) {
            black += 1;
            if (imgarr[x1][y1] === 0) {
              match += 1;
            }
          }
        }
      }
      const perc = match / black;
      matches.push([perc, ch]);
    }
    captcha += matches.reduce(
      function (a, b) {
        return a[0] > b[0] ? a : b;
      },
      [0, 0]
    )[1];
  }
  return captcha;
};


const uri_to_img_data = (URI) => {
  return new Promise(function (resolve, reject) {
    if (URI == null) return reject();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let image = new Image();
    image.addEventListener(
      "load",
      function () {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(context.getImageData(0, 0, canvas.width, canvas.height));
      },
      false
    );
    image.src = URI;
  });
};

const fill_captcha = (imgb64) => {
  const URI = imgb64;
  uri_to_img_data(URI).then((imageData) => {
    let arr = [];
    let newArr = [];
    for (let i = 0; i < imageData["data"].length; i += 4) {
      let gval =
        imageData["data"][i] * 0.299 +
        imageData["data"][i + 1] * 0.587 +
        imageData["data"][i + 2] * 0.114;
      arr.push(gval);
    }
    while (arr.length) newArr.push(arr.splice(0, 180));
    const res = captcha_parse(newArr);
    document.getElementById("captchaCheck").value = res;
  });
};

const solve_captcha = (img) => {
  const image = img.src;
  fill_captcha(image);
};


const pre_img = (img) => {
  let avg = 0;
  img.forEach((e) => e.forEach((f) => (avg += f)));
  avg /= 24 * 22;
  var bits = new Array(img.length);
  for (let i = 0; i < img.length; i += 1) {
    bits[i] = new Array(img[0].length);
    for (let j = 0; j < img[0].length; j += 1) {
      if (img[i][j] > avg) {
        bits[i][j] = 1;
      } else {
        bits[i][j] = 0;
      }
    }
  }
  return bits;
};

const saturation = (d) => {
  var saturate = new Array(d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    var min = Math.min(d[i], d[i + 1], d[i + 2]);
    var max = Math.max(d[i], d[i + 1], d[i + 2]);
    saturate[i / 4] = Math.round(((max - min) * 255) / max);
  }
  var img = new Array(40);
  for (let i = 0; i < 40; i += 1) {
    img[i] = new Array(200);
    for (let j = 0; j < 200; j += 1) {
      img[i][j] = saturate[i * 200 + j];
    }
  }
  var bls = new Array(6);
  for (let i = 0; i < 6; i += 1) {
    var x1 = (i + 1) * 25 + 2;
    var y1 = 7 + 5 * (i % 2) + 1;
    var x2 = (i + 2) * 25 + 1;
    var y2 = 35 - 5 * ((i + 1) % 2);
    bls[i] = img.slice(y1, y2).map((row) => row.slice(x1, x2));
  }
  return bls;
};

const flatten = (arr) => {
  var bits = new Array(arr.length * arr[0].length);
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = 0; j < arr[0].length; j += 1) {
      bits[i * arr[0].length + j] = arr[i][j];
    }
  }
  return bits;
};

const solve = async (img, textB) => {
  const weights = bitmaps.weights; // Float32Array of length 16896
  const biases = bitmaps.biases;   // Float32Array of length 32
  const label_txt = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const pd = ctx.getImageData(0, 0, 200, 40);
  let bls = saturation(pd.data);
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    const flatImg = flatten(pre_img(bls[i])); // Length 528
    
    // Direct, zero-allocation forward pass
    const logits = new Float32Array(32);
    for (let c = 0; c < 32; c++) {
      let sum = biases[c];
      for (let r = 0; r < 528; r++) {
        sum += flatImg[r] * weights[r * 32 + c];
      }
      logits[c] = sum;
    }
    
    // Softmax (numerical stable)
    let maxLogit = -Infinity;
    for (let c = 0; c < 32; c++) {
      if (logits[c] > maxLogit) maxLogit = logits[c];
    }
    
    let sumExp = 0;
    const exps = new Float32Array(32);
    for (let c = 0; c < 32; c++) {
      exps[c] = Math.exp(logits[c] - maxLogit);
      sumExp += exps[c];
    }
    
    let maxIdx = 0;
    let maxProb = -Infinity;
    for (let c = 0; c < 32; c++) {
      const prob = exps[c] / sumExp;
      if (prob > maxProb) {
        maxProb = prob;
        maxIdx = c;
      }
    }
    
    out += label_txt[maxIdx];
  }
  textB.value = out;
};

function myMain(evt) {
  if (document.URL.match('https://vtopcc.vit.ac.in/vtop/initialProcess')) {
    const jsInitChecktimer = setInterval(checkForJS_Finish, 111);
    function checkForJS_Finish() {
      let element = document.querySelector('img[alt="vtopCaptcha"]');
      if (element) {
        clearInterval(jsInitChecktimer);
        solve_captcha(element);
        let observer = new MutationObserver(function () {
          solve_captcha(document.querySelector('img[alt="vtopCaptcha"]'));
        });
        observer.observe(document.getElementById("captchaRefresh"), {
          childList: true,
        });
      }
    }
  }
  var img = document.getElementsByClassName("form-control img-fluid bg-light border-0")[0];
  if (!img) return;
  img.style.height = "40px!important";
  img.style.width = "200px!important";
  var textB = document.getElementById("captchaStr");
  var submitB = document.getElementById("submitBtn");
  solve(img, textB);
  submitB.focus();
}

window.addEventListener("load", myMain, false);