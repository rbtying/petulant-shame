ace.define("ace/mode/xml", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/tokenizer", "ace/mode/xml_highlight_rules", "ace/mode/behaviour/xml", "ace/mode/folding/xml"], function (e, t, n) {
    var r = e("../lib/oop"), i = e("./text").Mode, s = e("../tokenizer").Tokenizer, o = e("./xml_highlight_rules").XmlHighlightRules, u = e("./behaviour/xml").XmlBehaviour, a = e("./folding/xml").FoldMode, f = function () {
        this.HighlightRules = o, this.$behaviour = new u, this.foldingRules = new a
    };
    r.inherits(f, i), function () {
        this.blockComment = {start: "<!--", end: "-->"}
    }.call(f.prototype), t.Mode = f
}), ace.define("ace/mode/xml_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/xml_util", "ace/mode/text_highlight_rules"], function (e, t, n) {
    var r = e("../lib/oop"), i = e("./xml_util"), s = e("./text_highlight_rules").TextHighlightRules, o = function (e) {
        this.$rules = {start: [
            {token: "punctuation.string.begin", regex: "<\\!\\[CDATA\\[", next: "cdata"},
            {token: ["punctuation.instruction.begin", "keyword.instruction"], regex: "(<\\?)(xml)(?=[\\s])", next: "xml_declaration"},
            {token: ["punctuation.instruction.begin", "keyword.instruction"], regex: "(<\\?)([-_a-zA-Z0-9]+)", next: "instruction"},
            {token: "comment", regex: "<\\!--", next: "comment"},
            {token: ["punctuation.doctype.begin", "meta.tag.doctype"], regex: "(<\\!)(DOCTYPE)(?=[\\s])", next: "doctype"},
            {include: "tag"},
            {include: "reference"}
        ], xml_declaration: [
            {include: "attributes"},
            {include: "instruction"}
        ], instruction: [
            {token: "punctuation.instruction.end", regex: "\\?>", next: "start"}
        ], doctype: [
            {include: "space"},
            {include: "string"},
            {token: "punctuation.doctype.end", regex: ">", next: "start"},
            {token: "xml-pe", regex: "[-_a-zA-Z0-9:]+"},
            {token: "punctuation.begin", regex: "\\[", push: "declarations"}
        ], declarations: [
            {token: "text", regex: "\\s+"},
            {token: "punctuation.end", regex: "]", next: "pop"},
            {token: ["punctuation.begin", "keyword"], regex: "(<\\!)([-_a-zA-Z0-9]+)", push: [
                {token: "text", regex: "\\s+"},
                {token: "punctuation.end", regex: ">", next: "pop"},
                {include: "string"}
            ]}
        ], cdata: [
            {token: "string.end", regex: "\\]\\]>", next: "start"},
            {token: "text", regex: "\\s+"},
            {token: "text", regex: "(?:[^\\]]|\\](?!\\]>))+"}
        ], comment: [
            {token: "comment", regex: "-->", next: "start"},
            {defaultToken: "comment"}
        ], tag: [
            {token: ["meta.tag.punctuation.begin", "meta.tag.name"], regex: "(<)((?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+)", next: [
                {include: "attributes"},
                {token: "meta.tag.punctuation.end", regex: "/?>", next: "start"}
            ]},
            {token: ["meta.tag.punctuation.begin", "meta.tag.name"], regex: "(</)((?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+)", next: [
                {include: "space"},
                {token: "meta.tag.punctuation.end", regex: ">", next: "start"}
            ]}
        ], space: [
            {token: "text", regex: "\\s+"}
        ], reference: [
            {token: "constant.language.escape", regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"},
            {token: "invalid.illegal", regex: "&"}
        ], string: [
            {token: "string", regex: "'", push: "qstring_inner"},
            {token: "string", regex: '"', push: "qqstring_inner"}
        ], qstring_inner: [
            {token: "string", regex: "'", next: "pop"},
            {include: "reference"},
            {defaultToken: "string"}
        ], qqstring_inner: [
            {token: "string", regex: '"', next: "pop"},
            {include: "reference"},
            {defaultToken: "string"}
        ], attributes: [
            {token: "entity.other.attribute-name", regex: "(?:[-_a-zA-Z0-9]+:)?[-_a-zA-Z0-9]+"},
            {token: "keyword.operator.separator", regex: "="},
            {include: "space"},
            {include: "string"}
        ]}, this.constructor === o && this.normalizeRules()
    };
    (function () {
        this.embedTagRules = function (e, t, n) {
            this.$rules.tag.unshift({token: ["meta.tag.punctuation.begin", "meta.tag.name." + n], regex: "(<)(" + n + ")", next: [
                {include: "space"},
                {include: "attributes"},
                {token: "meta.tag.punctuation.end", regex: "/?>", next: t + "start"}
            ]}), this.$rules[n + "-end"] = [
                {include: "space"},
                {token: "meta.tag.punctuation.end", regex: ">", next: "start", onMatch: function (e, t, n) {
                    return n.splice(0), this.token
                }}
            ], this.embedRules(e, t, [
                {token: ["meta.tag.punctuation.begin", "meta.tag.name." + n], regex: "(</)(" + n + ")", next: n + "-end"},
                {token: "string.begin", regex: "<\\!\\[CDATA\\["},
                {token: "string.end", regex: "\\]\\]>"}
            ])
        }
    }).call(s.prototype), r.inherits(o, s), t.XmlHighlightRules = o
}), ace.define("ace/mode/xml_util", ["require", "exports", "module"], function (e, t, n) {
    function r(e) {
        return[
            {token: "string", regex: '"', next: e + "_qqstring"},
            {token: "string", regex: "'", next: e + "_qstring"}
        ]
    }

    function i(e, t) {
        return[
            {token: "string", regex: e, next: t},
            {token: "constant.language.escape", regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"},
            {defaultToken: "string"}
        ]
    }

    t.tag = function (e, t, n, s) {
        e[t] = [
            {token: "text", regex: "\\s+"},
            {token: s ? function (e) {
                return s[e] ? "meta.tag.tag-name." + s[e] : "meta.tag.tag-name"
            } : "meta.tag.tag-name", regex: "[-_a-zA-Z0-9:]+", next: t + "_embed_attribute_list"},
            {token: "empty", regex: "", next: t + "_embed_attribute_list"}
        ], e[t + "_qstring"] = i("'", t + "_embed_attribute_list"), e[t + "_qqstring"] = i('"', t + "_embed_attribute_list"), e[t + "_embed_attribute_list"] = [
            {token: "meta.tag.r", regex: "/?>", next: n},
            {token: "keyword.operator", regex: "="},
            {token: "entity.other.attribute-name", regex: "[-_a-zA-Z0-9:]+"},
            {token: "constant.numeric", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"},
            {token: "text", regex: "\\s+"}
        ].concat(r(t))
    }
}), ace.define("ace/mode/behaviour/xml", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/mode/behaviour/cstyle", "ace/token_iterator"], function (e, t, n) {
    function u(e, t) {
        var n = e.type.split(".");
        return t.split(".").every(function (e) {
            return n.indexOf(e) !== -1
        })
    }

    var r = e("../../lib/oop"), i = e("../behaviour").Behaviour, s = e("./cstyle").CstyleBehaviour, o = e("../../token_iterator").TokenIterator, a = function () {
        this.inherit(s, ["string_dquotes"]), this.add("autoclosing", "insertion", function (e, t, n, r, i) {
            if (i == ">") {
                var s = n.getCursorPosition(), a = new o(r, s.row, s.column), f = a.getCurrentToken();
                if (f && u(f, "string") && a.getCurrentTokenColumn() + f.value.length > s.column)return;
                var l = !1;
                if (!f || !u(f, "meta.tag") && (!u(f, "text") || !f.value.match("/"))) {
                    do f = a.stepBackward(); while (f && (u(f, "string") || u(f, "keyword.operator") || u(f, "entity.attribute-name") || u(f, "text")))
                } else l = !0;
                if (!f || !u(f, "meta.tag.name") || a.stepBackward().value.match("/"))return;
                var c = f.value;
                if (l)var c = c.substring(0, s.column - f.start);
                return{text: "></" + c + ">", selection: [1, 1]}
            }
        }), this.add("autoindent", "insertion", function (e, t, n, r, i) {
            if (i == "\n") {
                var s = n.getCursorPosition(), o = r.getLine(s.row), u = o.substring(s.column, s.column + 2);
                if (u == "</") {
                    var a = this.$getIndent(o), f = a + r.getTabString();
                    return{text: "\n" + f + "\n" + a, selection: [1, f.length, 1, f.length]}
                }
            }
        })
    };
    r.inherits(a, i), t.XmlBehaviour = a
}), ace.define("ace/mode/behaviour/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"], function (e, t, n) {
    var r = e("../../lib/oop"), i = e("../behaviour").Behaviour, s = e("../../token_iterator").TokenIterator, o = e("../../lib/lang"), u = ["text", "paren.rparen", "punctuation.operator"], a = ["text", "paren.rparen", "punctuation.operator", "comment"], f = 0, l = -1, c = "", h = 0, p = -1, d = "", v = "", m = function () {
        m.isSaneInsertion = function (e, t) {
            var n = e.getCursorPosition(), r = new s(t, n.row, n.column);
            if (!this.$matchTokenType(r.getCurrentToken() || "text", u)) {
                var i = new s(t, n.row, n.column + 1);
                if (!this.$matchTokenType(i.getCurrentToken() || "text", u))return!1
            }
            return r.stepForward(), r.getCurrentTokenRow() !== n.row || this.$matchTokenType(r.getCurrentToken() || "text", a)
        }, m.$matchTokenType = function (e, t) {
            return t.indexOf(e.type || e) > -1
        }, m.recordAutoInsert = function (e, t, n) {
            var r = e.getCursorPosition(), i = t.doc.getLine(r.row);
            this.isAutoInsertedClosing(r, i, c[0]) || (f = 0), l = r.row, c = n + i.substr(r.column), f++
        }, m.recordMaybeInsert = function (e, t, n) {
            var r = e.getCursorPosition(), i = t.doc.getLine(r.row);
            this.isMaybeInsertedClosing(r, i) || (h = 0), p = r.row, d = i.substr(0, r.column) + n, v = i.substr(r.column), h++
        }, m.isAutoInsertedClosing = function (e, t, n) {
            return f > 0 && e.row === l && n === c[0] && t.substr(e.column) === c
        }, m.isMaybeInsertedClosing = function (e, t) {
            return h > 0 && e.row === p && t.substr(e.column) === v && t.substr(0, e.column) == d
        }, m.popAutoInsertedClosing = function () {
            c = c.substr(1), f--
        }, m.clearMaybeInsertedClosing = function () {
            h = 0, p = -1
        }, this.add("braces", "insertion", function (e, t, n, r, i) {
            var s = n.getCursorPosition(), u = r.doc.getLine(s.row);
            if (i == "{") {
                var a = n.getSelectionRange(), f = r.doc.getTextRange(a);
                if (f !== "" && f !== "{" && n.getWrapBehavioursEnabled())return{text: "{" + f + "}", selection: !1};
                if (m.isSaneInsertion(n, r))return/[\]\}\)]/.test(u[s.column]) ? (m.recordAutoInsert(n, r, "}"), {text: "{}", selection: [1, 1]}) : (m.recordMaybeInsert(n, r, "{"), {text: "{", selection: [1, 1]})
            } else if (i == "}") {
                var l = u.substring(s.column, s.column + 1);
                if (l == "}") {
                    var c = r.$findOpeningBracket("}", {column: s.column + 1, row: s.row});
                    if (c !== null && m.isAutoInsertedClosing(s, u, i))return m.popAutoInsertedClosing(), {text: "", selection: [1, 1]}
                }
            } else if (i == "\n" || i == "\r\n") {
                var p = "";
                m.isMaybeInsertedClosing(s, u) && (p = o.stringRepeat("}", h), m.clearMaybeInsertedClosing());
                var l = u.substring(s.column, s.column + 1);
                if (l == "}" || p !== "") {
                    var d = r.findMatchingBracket({row: s.row, column: s.column + 1}, "}");
                    if (!d)return null;
                    var v = this.getNextLineIndent(e, u.substring(0, s.column), r.getTabString()), g = this.$getIndent(u);
                    return{text: "\n" + v + "\n" + g + p, selection: [1, v.length, 1, v.length]}
                }
            }
        }), this.add("braces", "deletion", function (e, t, n, r, i) {
            var s = r.doc.getTextRange(i);
            if (!i.isMultiLine() && s == "{") {
                var o = r.doc.getLine(i.start.row), u = o.substring(i.end.column, i.end.column + 1);
                if (u == "}")return i.end.column++, i;
                h--
            }
        }), this.add("parens", "insertion", function (e, t, n, r, i) {
            if (i == "(") {
                var s = n.getSelectionRange(), o = r.doc.getTextRange(s);
                if (o !== "" && n.getWrapBehavioursEnabled())return{text: "(" + o + ")", selection: !1};
                if (m.isSaneInsertion(n, r))return m.recordAutoInsert(n, r, ")"), {text: "()", selection: [1, 1]}
            } else if (i == ")") {
                var u = n.getCursorPosition(), a = r.doc.getLine(u.row), f = a.substring(u.column, u.column + 1);
                if (f == ")") {
                    var l = r.$findOpeningBracket(")", {column: u.column + 1, row: u.row});
                    if (l !== null && m.isAutoInsertedClosing(u, a, i))return m.popAutoInsertedClosing(), {text: "", selection: [1, 1]}
                }
            }
        }), this.add("parens", "deletion", function (e, t, n, r, i) {
            var s = r.doc.getTextRange(i);
            if (!i.isMultiLine() && s == "(") {
                var o = r.doc.getLine(i.start.row), u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == ")")return i.end.column++, i
            }
        }), this.add("brackets", "insertion", function (e, t, n, r, i) {
            if (i == "[") {
                var s = n.getSelectionRange(), o = r.doc.getTextRange(s);
                if (o !== "" && n.getWrapBehavioursEnabled())return{text: "[" + o + "]", selection: !1};
                if (m.isSaneInsertion(n, r))return m.recordAutoInsert(n, r, "]"), {text: "[]", selection: [1, 1]}
            } else if (i == "]") {
                var u = n.getCursorPosition(), a = r.doc.getLine(u.row), f = a.substring(u.column, u.column + 1);
                if (f == "]") {
                    var l = r.$findOpeningBracket("]", {column: u.column + 1, row: u.row});
                    if (l !== null && m.isAutoInsertedClosing(u, a, i))return m.popAutoInsertedClosing(), {text: "", selection: [1, 1]}
                }
            }
        }), this.add("brackets", "deletion", function (e, t, n, r, i) {
            var s = r.doc.getTextRange(i);
            if (!i.isMultiLine() && s == "[") {
                var o = r.doc.getLine(i.start.row), u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == "]")return i.end.column++, i
            }
        }), this.add("string_dquotes", "insertion", function (e, t, n, r, i) {
            if (i == '"' || i == "'") {
                var s = i, o = n.getSelectionRange(), u = r.doc.getTextRange(o);
                if (u !== "" && u !== "'" && u != '"' && n.getWrapBehavioursEnabled())return{text: s + u + s, selection: !1};
                var a = n.getCursorPosition(), f = r.doc.getLine(a.row), l = f.substring(a.column - 1, a.column);
                if (l == "\\")return null;
                var c = r.getTokens(o.start.row), h = 0, p, d = -1;
                for (var v = 0; v < c.length; v++) {
                    p = c[v], p.type == "string" ? d = -1 : d < 0 && (d = p.value.indexOf(s));
                    if (p.value.length + h > o.start.column)break;
                    h += c[v].value.length
                }
                if (!p || d < 0 && p.type !== "comment" && (p.type !== "string" || o.start.column !== p.value.length + h - 1 && p.value.lastIndexOf(s) === p.value.length - 1)) {
                    if (!m.isSaneInsertion(n, r))return;
                    return{text: s + s, selection: [1, 1]}
                }
                if (p && p.type === "string") {
                    var g = f.substring(a.column, a.column + 1);
                    if (g == s)return{text: "", selection: [1, 1]}
                }
            }
        }), this.add("string_dquotes", "deletion", function (e, t, n, r, i) {
            var s = r.doc.getTextRange(i);
            if (!i.isMultiLine() && (s == '"' || s == "'")) {
                var o = r.doc.getLine(i.start.row), u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == s)return i.end.column++, i
            }
        })
    };
    r.inherits(m, i), t.CstyleBehaviour = m
}), ace.define("ace/mode/folding/xml", ["require", "exports", "module", "ace/lib/oop", "ace/lib/lang", "ace/range", "ace/mode/folding/fold_mode", "ace/token_iterator"], function (e, t, n) {
    var r = e("../../lib/oop"), i = e("../../lib/lang"), s = e("../../range").Range, o = e("./fold_mode").FoldMode, u = e("../../token_iterator").TokenIterator, a = t.FoldMode = function (e) {
        o.call(this), this.voidElements = e || {}
    };
    r.inherits(a, o), function () {
        this.getFoldWidget = function (e, t, n) {
            var r = this._getFirstTagInLine(e, n);
            return r.closing ? t == "markbeginend" ? "end" : "" : !r.tagName || this.voidElements[r.tagName.toLowerCase()] ? "" : r.selfClosing ? "" : r.value.indexOf("/" + r.tagName) !== -1 ? "" : "start"
        }, this._getFirstTagInLine = function (e, t) {
            var n = e.getTokens(t), r = "";
            for (var s = 0; s < n.length; s++) {
                var o = n[s];
                o.type.lastIndexOf("meta.tag", 0) === 0 ? r += o.value : r += i.stringRepeat(" ", o.value.length)
            }
            return this._parseTag(r)
        }, this.tagRe = /^(\s*)(<?(\/?)([-_a-zA-Z0-9:!]*)\s*(\/?)>?)/, this._parseTag = function (e) {
            var t = e.match(this.tagRe), n = 0;
            return{value: e, match: t ? t[2] : "", closing: t ? !!t[3] : !1, selfClosing: t ? !!t[5] || t[2] == "/>" : !1, tagName: t ? t[4] : "", column: t[1] ? n + t[1].length : n}
        }, this._readTagForward = function (e) {
            var t = e.getCurrentToken();
            if (!t)return null;
            var n = "", r;
            do if (t.type.lastIndexOf("meta.tag", 0) === 0) {
                if (!r)var r = {row: e.getCurrentTokenRow(), column: e.getCurrentTokenColumn()};
                n += t.value;
                if (n.indexOf(">") !== -1) {
                    var i = this._parseTag(n);
                    return i.start = r, i.end = {row: e.getCurrentTokenRow(), column: e.getCurrentTokenColumn() + t.value.length}, e.stepForward(), i
                }
            } while (t = e.stepForward());
            return null
        }, this._readTagBackward = function (e) {
            var t = e.getCurrentToken();
            if (!t)return null;
            var n = "", r;
            do if (t.type.lastIndexOf("meta.tag", 0) === 0) {
                r || (r = {row: e.getCurrentTokenRow(), column: e.getCurrentTokenColumn() + t.value.length}), n = t.value + n;
                if (n.indexOf("<") !== -1) {
                    var i = this._parseTag(n);
                    return i.end = r, i.start = {row: e.getCurrentTokenRow(), column: e.getCurrentTokenColumn()}, e.stepBackward(), i
                }
            } while (t = e.stepBackward());
            return null
        }, this._pop = function (e, t) {
            while (e.length) {
                var n = e[e.length - 1];
                if (!t || n.tagName == t.tagName)return e.pop();
                if (this.voidElements[t.tagName])return;
                if (this.voidElements[n.tagName]) {
                    e.pop();
                    continue
                }
                return null
            }
        }, this.getFoldWidgetRange = function (e, t, n) {
            var r = this._getFirstTagInLine(e, n);
            if (!r.match)return null;
            var i = r.closing || r.selfClosing, o = [], a;
            if (!i) {
                var f = new u(e, n, r.column), l = {row: n, column: r.column + r.tagName.length + 2};
                while (a = this._readTagForward(f)) {
                    if (a.selfClosing) {
                        if (!o.length)return a.start.column += a.tagName.length + 2, a.end.column -= 2, s.fromPoints(a.start, a.end);
                        continue
                    }
                    if (a.closing) {
                        this._pop(o, a);
                        if (o.length == 0)return s.fromPoints(l, a.start)
                    } else o.push(a)
                }
            } else {
                var f = new u(e, n, r.column + r.match.length), c = {row: n, column: r.column};
                while (a = this._readTagBackward(f)) {
                    if (a.selfClosing) {
                        if (!o.length)return a.start.column += a.tagName.length + 2, a.end.column -= 2, s.fromPoints(a.start, a.end);
                        continue
                    }
                    if (!a.closing) {
                        this._pop(o, a);
                        if (o.length == 0)return a.start.column += a.tagName.length + 2, s.fromPoints(a.start, c)
                    } else o.push(a)
                }
            }
        }
    }.call(a.prototype)
})