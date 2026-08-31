import { createSignal, onMount, onCleanup, JSXElement, Show } from "solid-js";

export function TypewriterText(props: { text: string; speed?: number }): JSXElement {
  const [displayedText, setDisplayedText] = createSignal("");
  
  onMount(() => {
    let i = 0;
    const speed = props.speed ?? 15;
    const interval = setInterval(() => {
      setDisplayedText(props.text.substring(0, i));
      i++;
      if (i > props.text.length) {
        clearInterval(interval);
      }
    }, speed);
    onCleanup(() => clearInterval(interval));
  });
  
  const formattedHtml = () => {
    let html = displayedText()
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br />");
    return html;
  };

  return <div innerHTML={formattedHtml()} />;
}
