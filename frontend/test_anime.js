import { animate } from "animejs";
const obj = { value: 0 };
animate(obj, {
  value: 100,
  duration: 100,
  update: () => console.log(obj.value),
});
