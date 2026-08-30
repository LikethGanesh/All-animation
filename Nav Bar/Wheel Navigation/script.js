(() => {
  const machine = document.querySelector(".ccm-11__machine");
  const stops = [...document.querySelectorAll(".ccm-11__stop")];
  const currentText = document.querySelector(".ccm-11__current");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  let active = 0; 
  let currentRotation = 0;

  const goTo = (i) => {
    let diff = i - active;
    
    if (diff > stops.length / 2) diff -= stops.length;
    if (diff < -stops.length / 2) diff += stops.length;
    
    const stepAngle = 360 / stops.length;
    
    currentRotation -= (diff * stepAngle);
    
    machine.style.setProperty("--rot", currentRotation);

    stops.forEach((s, n) => s.classList.toggle("is-active", n === i));
    currentText.textContent = stops[i].textContent;
    
    active = i;
  };

  stops.forEach((s, i) => {
    s.onclick = () => goTo(i);
  });

  prevBtn.onclick = () => {
    const prevIndex = (active - 1 + stops.length) % stops.length;
    goTo(prevIndex);
    prevBtn.classList.add("is-active");
    setTimeout(() => prevBtn.classList.remove("is-active"), 200);
  };

  nextBtn.onclick = () => {
    const nextIndex = (active + 1) % stops.length;
    goTo(nextIndex);
    nextBtn.classList.add("is-active");
    setTimeout(() => nextBtn.classList.remove("is-active"), 200);
  };
})();