import { useState } from 'react'
import type { Rule, RegexReplaceRule } from '../../types/rule'
import { useConfigStore } from '../../store/configStore'
import { validateRegexPattern } from '../../core/pipeline/transformers/regexReplace'
import { cn } from '../../lib/utils'

interface Props {
  sourceName: string
  rules: Rule[]
}

function TrimRuleItem({
  index,
  sourceName,
  isFirst,
  isLast,
}: {
  index: number
  sourceName: string
  isFirst: boolean
  isLast: boolean
}) {
  const { removeRule, moveRuleUp, moveRuleDown } = useConfigStore()
  return (
    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
      <span className="font-medium text-green-700 flex-1">Trim（前後の空白除去）</span>
      <button onClick={() => moveRuleUp(sourceName, index)} disabled={isFirst} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
      <button onClick={() => moveRuleDown(sourceName, index)} disabled={isLast} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
      <button onClick={() => removeRule(sourceName, index)} className="text-red-400 hover:text-red-600">✕</button>
    </div>
  )
}

function RegexRuleItem({
  rule,
  index,
  sourceName,
  isFirst,
  isLast,
}: {
  rule: RegexReplaceRule
  index: number
  sourceName: string
  isFirst: boolean
  isLast: boolean
}) {
  const { updateRule, removeRule, moveRuleUp, moveRuleDown } = useConfigStore()
  const patternError = validateRegexPattern(rule.pattern, rule.flags)

  const update = (patch: Partial<RegexReplaceRule>) =>
    updateRule(sourceName, index, { ...rule, ...patch })

  const toggleFlag = (flag: 'g' | 'i') => {
    const next = rule.flags.includes(flag)
      ? rule.flags.filter((f) => f !== flag)
      : [...rule.flags, flag]
    update({ flags: next })
  }

  return (
    <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-medium text-purple-700 flex-1">正規表現置換</span>
        <button onClick={() => moveRuleUp(sourceName, index)} disabled={isFirst} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
        <button onClick={() => moveRuleDown(sourceName, index)} disabled={isLast} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
        <button onClick={() => removeRule(sourceName, index)} className="text-red-400 hover:text-red-600">✕</button>
      </div>
      <div>
        <label className="text-gray-500">パターン</label>
        <input
          value={rule.pattern}
          onChange={(e) => update({ pattern: e.target.value })}
          placeholder="例: \d+"
          className={cn(
            'w-full mt-0.5 border rounded px-2 py-1 font-mono bg-white focus:outline-none focus:ring-1',
            patternError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-purple-300',
          )}
        />
        {patternError && <p className="text-red-500 mt-0.5">{patternError}</p>}
      </div>
      <div>
        <label className="text-gray-500">置換文字列</label>
        <input
          value={rule.replacement}
          onChange={(e) => update({ replacement: e.target.value })}
          placeholder="例: $1"
          className="w-full mt-0.5 border border-gray-300 rounded px-2 py-1 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-purple-300"
        />
      </div>
      <div className="flex gap-3">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={rule.flags.includes('g')}
            onChange={() => toggleFlag('g')}
            className="accent-purple-600"
          />
          <span className="text-gray-600">g（全置換）</span>
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={rule.flags.includes('i')}
            onChange={() => toggleFlag('i')}
            className="accent-purple-600"
          />
          <span className="text-gray-600">i（大文字小文字無視）</span>
        </label>
      </div>
    </div>
  )
}

export function RuleEditor({ sourceName, rules }: Props) {
  const { addRule } = useConfigStore()
  const [addType, setAddType] = useState<'' | 'trim' | 'regex'>('')

  const handleAdd = () => {
    if (addType === 'trim') {
      addRule(sourceName, { type: 'trim' })
    } else if (addType === 'regex') {
      addRule(sourceName, { type: 'regexReplace', pattern: '', replacement: '', flags: ['g'] })
    }
    setAddType('')
  }

  return (
    <div className="space-y-1.5 pl-2 border-l-2 border-gray-100">
      {rules.map((rule, i) =>
        rule.type === 'trim' ? (
          <TrimRuleItem
            key={i}
            index={i}
            sourceName={sourceName}
            isFirst={i === 0}
            isLast={i === rules.length - 1}
          />
        ) : (
          <RegexRuleItem
            key={i}
            rule={rule}
            index={i}
            sourceName={sourceName}
            isFirst={i === 0}
            isLast={i === rules.length - 1}
          />
        ),
      )}
      <div className="flex gap-2 items-center">
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value as '' | 'trim' | 'regex')}
          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
        >
          <option value="">+ ルール追加</option>
          <option value="trim">Trim</option>
          <option value="regex">正規表現置換</option>
        </select>
        {addType && (
          <button
            onClick={handleAdd}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            追加
          </button>
        )}
      </div>
    </div>
  )
}
