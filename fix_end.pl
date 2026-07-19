undef $/;
$content = <>;
$content =~ s/({\/\* Cancel footer \*\/}.*?<\/button>\n)\s*(\);.*?)}/$1                <\/div>\n              <\/div>\n            <\/div>\n          )}\n        <\/div>\n      <\/div>\n    <\/div>\n  );\n}/s;
print $content;
