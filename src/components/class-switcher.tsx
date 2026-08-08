"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, School } from "lucide-react";
import { useState } from "react";

export function ClassSwitcher({ className, allowDemoClasses }: { className: string; allowDemoClasses: boolean }) {
  const [selected, setSelected] = useState(className);
  const [notice, setNotice] = useState("");
  if (!allowDemoClasses) return <div className="class-chip" aria-label="当前班级"><School size={17} /><span>{className}</span></div>;
  const options = allowDemoClasses ? [className, "四年级二班", "六年级一班"] : [className];
  function choose(value: string) { setSelected(value); setNotice(value === className ? `已切回${value}` : `已切换到${value}的演示视图`); window.setTimeout(() => setNotice(""), 2400); }
  return <><DropdownMenu.Root><DropdownMenu.Trigger className="class-chip" aria-label="切换班级"><School size={17} /><span>{selected}</span>{selected !== className && <small>演示</small>}<ChevronDown size={14} /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="start" sideOffset={10} className="class-menu"><DropdownMenu.Label className="class-menu-label">选择班级</DropdownMenu.Label>{options.map((option) => <DropdownMenu.Item key={option} className="class-menu-item" onSelect={() => choose(option)}><span><strong>{option}</strong><small>{option === className ? "当前班级 · 实时数据" : "演示班级 · 示例数据"}</small></span>{selected === option && <Check size={16} />}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>{notice && <div className="class-switch-notice" role="status">{notice}</div>}</>;
}
