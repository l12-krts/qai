import { Label, Button } from "@heroui/react";
import { IoClose } from "react-icons/io5";
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export function Logo({cn}) {
  return(
    <svg xmlns="http://www.w3.org/2000/svg" className={cn} viewBox="336 156 238 168">
      <path d="M 360 300 L 390 270 L 420 240 L 450 210 L 480 180 L 480 210 L 480 240 L 480 270 L 480 270.00003 A 29.999969999999998 29.999969999999998 0 0 1 450.00003 300 L 450 300 L 420 300 L 390 300 L 360 300 Z" fill="#ffffff" fill-rule="evenodd" stroke="none" /><path d="M 490 300 L 490 270 L 490 269.99997 A 29.99996999999999 29.99996999999999 0 0 1 519.99997 240 L 520 240 L 550 240 L 550 270 L 550 274.9352046336526 A 25.064795366347393 25.064795366347393 0 0 1 524.9352046336526 300 L 520 300 L 490 300 Z" fill="#ffffff" fill-rule="evenodd" stroke="none" /><path d="M 550 240 L 520 210 L 490 180 L 520 180 L 530.2532423602005 180 A 19.746757639799466 19.746757639799466 0 0 1 550 199.74675763979945 L 550 210 L 550 240 Z" fill="#ffffff" fill-rule="evenodd" stroke="none" />
    </svg>
  );
}

const closeWindow = async () => {
  const appWindow = getCurrentWebviewWindow();
  await appWindow.close();
}

function CloseButton() {
  return(
    <Button className={"max-w-5 h-5 mr-3 active:scale-90 bg-transparent text-white hover:text-red-500 transition-all"} onClick={() => { closeWindow() }}>
      <IoClose className="scale-120"></IoClose>
    </Button>
  );
}

export default function WindowDecorations({}) {
  return(
    <>
      <div className="w-full z-20 absolute pt-4 justify-between top-0 left-0 h-12 flex flex-row bg-linear-180 from-black/80 to-transparent">
        <Logo cn="h-5 w-auto ml-4"></Logo>
        <Label>qAI</Label>
        <CloseButton></CloseButton>
      </div>
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 z-10">
        <div className="absolute inset-0 backdrop-blur-[2px]"
            style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 60%)" }} />
        <div className="absolute inset-0 backdrop-blur-[6px]"
            style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 40%)" }} />
        <div className="absolute inset-0 backdrop-blur-[12px]"
            style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 25%)" }} />
        <div className="absolute inset-0 backdrop-blur-[18px]"
            style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 10%)" }} />
      </div>
    </>
  );
}