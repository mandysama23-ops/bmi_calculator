(function(){
 
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });


  class BMICalculator {
    static calculateMetric(weightKg, heightM) {
      if (weightKg <= 0 || heightM <= 0) throw new Error("Weight and height must be greater than zero.");
      const bmi = weightKg / Math.pow(heightM, 2);
      const bmiPrime = bmi / 25;
      const ponderalIndex = weightKg / Math.pow(heightM, 3);
      return { bmi: parseFloat(bmi.toFixed(1)), bmiPrime: parseFloat(bmiPrime.toFixed(2)), ponderalIndex: parseFloat(ponderalIndex.toFixed(1)), classification: this.getClassification(bmi) };
    }
    static getClassification(bmi) {
      if (bmi < 16) return "Severe Thinness";
      if (bmi >= 16 && bmi < 17) return "Moderate Thinness";
      if (bmi >= 17 && bmi < 18.5) return "Mild Thinness";
      if (bmi >= 18.5 && bmi < 25) return "Normal";
      if (bmi >= 25 && bmi < 30) return "Overweight";
      if (bmi >= 30 && bmi < 35) return "Obese Class I";
      if (bmi >= 35 && bmi < 40) return "Obese Class II";
      return "Obese Class III";
    }
  }

 
  const state = { unit: 'cm_lb' };
  const clamp = (n,min,max) => Math.max(min, Math.min(max, n));

  const els = {
    btnCmLb: document.getElementById('btnCmLb'),
    btnFtKg: document.getElementById('btnFtKg'),
    heightCmRow: document.getElementById('heightCmRow'),
    heightFtRow: document.getElementById('heightFtRow'),
    heightCm: document.getElementById('heightCm'),
    heightFt: document.getElementById('heightFt'),
    heightIn: document.getElementById('heightIn'),
    weightLbRow: document.getElementById('weightLbRow'),
    weightKgRow: document.getElementById('weightKgRow'),
    weightKg: document.getElementById('weightKg'),
    weightLb: document.getElementById('weightLb'),
    gaugeBmi: document.getElementById('gaugeBmi'),
    gaugeClass: document.getElementById('gaugeClass'),
    needle: document.getElementById('needle'),
    bmiPrime: document.getElementById('bmiPrime'),
    ponderalIndex: document.getElementById('ponderalIndex'),
    healthyRange: document.getElementById('healthyRange'),
  };

  function getHeightMeters(){
    if(state.unit === 'cm_lb') return parseFloat(els.heightCm.value || 0) / 100;
    const ft = parseFloat(els.heightFt.value || 0), inch = parseFloat(els.heightIn.value || 0);
    return (ft*12 + inch) * 0.0254;
  }
  function getWeightKg(){
    if(state.unit === 'cm_lb') return parseFloat(els.weightLb.value || 0) * 0.453592;
    return parseFloat(els.weightKg.value || 0);
  }
  function kgToLb(kg){ return kg / 0.453592; }

  const classificationColor = {
    "Severe Thinness":   "var(--blue)",
    "Moderate Thinness": "var(--blue)",
    "Mild Thinness":     "var(--blue)",
    "Normal":             "var(--green)",
    "Overweight":         "var(--orange)",
    "Obese Class I":     "var(--red)",
    "Obese Class II":    "var(--red)",
    "Obese Class III":   "var(--red)",
  };

  function recalcBMI(){
    const h = getHeightMeters(), w = getWeightKg();
    if(!h || !w || h<=0 || w<=0){ els.gaugeBmi.textContent = '--'; return; }

    const result = BMICalculator.calculateMetric(w, h);
    const catColor = classificationColor[result.classification] || 'var(--ink)';

    els.gaugeBmi.textContent = result.bmi.toFixed(1);
    els.gaugeBmi.style.color = 'var(--ink)'; /* result stays black */
    els.gaugeClass.textContent = result.classification;
    els.gaugeClass.style.color = catColor;
    els.bmiPrime.textContent = result.bmiPrime.toFixed(2);
    els.ponderalIndex.textContent = result.ponderalIndex.toFixed(1);

    const minKg = 18.5*h*h, maxKg = 24.9*h*h;
    els.healthyRange.textContent = state.unit === 'cm_lb'
      ? `${kgToLb(minKg).toFixed(0)}–${kgToLb(maxKg).toFixed(0)} lb`
      : `${minKg.toFixed(0)}–${maxKg.toFixed(0)} kg`;

   
    const pct = clamp((result.bmi - 15) / (40 - 15), 0, 1);
    const angle = -90 + pct*180;
    els.needle.setAttribute('transform', `rotate(${angle} 150 150)`);
    els.needle.querySelector('line').setAttribute('stroke', catColor);
    els.needle.querySelector('circle').setAttribute('fill', catColor);

    if(typeof updateTargetRange === 'function') updateTargetRange(w);
  }

  function setUnit(unit){
    state.unit = unit;
    const isCmLb = unit === 'cm_lb';
    els.btnCmLb.setAttribute('aria-pressed', isCmLb);
    els.btnFtKg.setAttribute('aria-pressed', !isCmLb);
    els.heightCmRow.style.display = isCmLb ? 'flex' : 'none';
    els.heightFtRow.style.display = isCmLb ? 'none' : 'flex';
    els.weightLbRow.style.display = isCmLb ? 'flex' : 'none';
    els.weightKgRow.style.display = isCmLb ? 'none' : 'flex';
    recalcBMI();
  }

  els.btnCmLb.addEventListener('click', () => setUnit('cm_lb'));
  els.btnFtKg.addEventListener('click', () => setUnit('ft_kg'));
  [els.heightCm, els.heightFt, els.heightIn, els.weightKg, els.weightLb].forEach(i => i.addEventListener('input', recalcBMI));

  /* ---------------- Calorie Intake Tracker & Manager ---------------- */
  const calorieState = { log: [], targetMin: 1890, targetMax: 2190 };

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function computeTotal(){
    return calorieState.log.reduce((sum, item) => sum + item.kcal, 0);
  }

  function addFood(name, kcal){
    if(!name || !kcal || kcal <= 0) return;
    calorieState.log.push({ id: Date.now() + Math.random(), name, kcal });
    renderCalorieCard();
  }

  function removeFood(id){
    calorieState.log = calorieState.log.filter(item => item.id !== id);
    renderCalorieCard();
  }

  function renderCalorieCard(){
    const total = computeTotal();
    document.getElementById('calorieTotal').textContent = total.toLocaleString();

    
    const scaleMax = calorieState.targetMax * 1.15;
    const pct = clamp((total / scaleMax) * 100, 0, 100);
    const fill = document.getElementById('calorieProgressFill');
    fill.style.width = pct + '%';

    const badge = document.getElementById('calorieBadge');
    if(total === 0){
      fill.style.background = 'var(--ink-soft)';
      badge.textContent = 'Start logging';
      badge.style.background = 'rgba(20,22,28,0.06)';
      badge.style.color = 'var(--ink-soft)';
    } else if(total < calorieState.targetMin){
      fill.style.background = 'var(--blue)';
      badge.textContent = 'Under target';
      badge.style.background = 'rgba(61,90,254,0.12)';
      badge.style.color = '#3D5AFE';
    } else if(total <= calorieState.targetMax){
      fill.style.background = 'var(--green)';
      badge.textContent = 'On track';
      badge.style.background = 'rgba(0,227,138,0.12)';
      badge.style.color = '#059862';
    } else {
      fill.style.background = 'var(--red)';
      badge.textContent = 'Over target';
      badge.style.background = 'rgba(255,59,48,0.12)';
      badge.style.color = '#D6291F';
    }

    const listEl = document.getElementById('foodLog');
    listEl.innerHTML = '';
    if(calorieState.log.length === 0){
      listEl.innerHTML = '<li class="food-empty">No meals logged yet — add your first entry above.</li>';
    } else {
      calorieState.log.forEach(item => {
        const li = document.createElement('li');
        li.className = 'food-item';
        li.innerHTML = `<span class="fi-name">${escapeHtml(item.name)}</span><span class="fi-kcal">${item.kcal.toLocaleString()} kcal</span>`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fi-remove';
        btn.setAttribute('aria-label', 'Remove ' + item.name);
        btn.textContent = '✕';
        btn.addEventListener('click', () => removeFood(item.id));
        li.appendChild(btn);
        listEl.appendChild(li);
      });
    }
  }

  function updateTargetRange(weightKg){
  
    const maintenance = weightKg * 30;
    let min = clamp(Math.round((maintenance - 150) / 10) * 10, 1200, 4000);
    let max = clamp(Math.round((maintenance + 150) / 10) * 10, min + 100, 4500);
    calorieState.targetMin = min;
    calorieState.targetMax = max;

    document.getElementById('calorieTargetLabel').textContent =
      `Target: ${min.toLocaleString()}–${max.toLocaleString()} kcal (based on your weight)`;
    document.getElementById('scaleMidLabel').textContent = Math.round((min + max) / 2).toLocaleString();
    document.getElementById('scaleMaxLabel').textContent = max.toLocaleString() + '+';

    renderCalorieCard();
  }

  const foodNameInput = document.getElementById('foodName');
  const foodKcalInput = document.getElementById('foodKcal');
  const addFoodBtn = document.getElementById('addFoodBtn');

  function submitFood(){
    addFood(foodNameInput.value.trim(), parseFloat(foodKcalInput.value));
    foodNameInput.value = '';
    foodKcalInput.value = '';
    foodNameInput.focus();
  }

  addFoodBtn.addEventListener('click', submitFood);
  foodKcalInput.addEventListener('keydown', e => { if(e.key === 'Enter') submitFood(); });
  foodNameInput.addEventListener('keydown', e => { if(e.key === 'Enter') submitFood(); });

  
  updateTargetRange(getWeightKg());
  recalcBMI();
})();

const slides = [
    "BMI calculator/Slide1.JPG",
    "BMI calculator/Slide2.JPG",
    "BMI calculator/Slide3.JPG",
    "BMI calculator/Slide4.JPG",
    "BMI calculator/Slide5.JPG",
    "BMI calculator/Slide6.JPG"
];

let current = 0;

const img = document.getElementById("slideImage");
const presentation = document.getElementById("presentation");
const app = document.getElementById("mainApp");

function showSlide() {
    img.style.opacity = 0;

    setTimeout(() => {
        img.src = slides[current];
        img.style.opacity = 1;
    }, 250);
}

document.addEventListener("keydown", (e) => {

    if (e.key === "ArrowRight") {

        if (current < slides.length - 1) {
            current++;
            showSlide();
        } else {
            presentation.style.opacity = 0;

            setTimeout(() => {
                presentation.style.display = "none";
                app.style.opacity = 1;
            }, 800);
        }

    }

    if (e.key === "ArrowLeft") {

        if (current > 0) {
            current--;
            showSlide();
        }

    }

});
