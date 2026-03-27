import { escapeHtmlAttr } from "../server/_core/html";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const input = `دليل "البراند" الكامل <test> & 'x'`;
const out = escapeHtmlAttr(input);

assert(
  out === "دليل &quot;البراند&quot; الكامل &lt;test&gt; &amp; &#39;x&#39;",
  `escapeHtmlAttr output mismatch.\nExpected: دليل &quot;البراند&quot; الكامل &lt;test&gt; &amp; &#39;x&#39;\nGot: ${out}`,
);

assert(!out.includes(`"`), "Output still contains double quote");
assert(!out.includes("<test>"), "Output still contains raw angle brackets");

console.log("OK: escapeHtmlAttr");

