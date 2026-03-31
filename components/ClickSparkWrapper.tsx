"use client";

import ClickSpark from "@/components/reactbits/ClickSpark";

export default function ClickSparkWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClickSpark sparkColor="#ffffff" sparkRadius={15} sparkCount={8} sparkSize={4} duration={400}>
      {children}
    </ClickSpark>
  );
}
