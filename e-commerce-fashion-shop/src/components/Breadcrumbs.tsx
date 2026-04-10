import { Link } from 'react-router-dom'

type Crumb = { label: string; to?: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
	return (
		<nav className="body-small text-neutral-600" aria-label="Đường dẫn">
			<ol className="flex items-center gap-2">
				{items.map((item, idx) => (
					<li key={idx} className="flex items-center gap-2">
						{item.to ? (
							<Link to={item.to} className="hover:text-neutral-900 transition-colors">{item.label}</Link>
						) : (
							<span className="text-neutral-900 font-medium">{item.label}</span>
						)}
						{idx < items.length - 1 && <span className="text-neutral-400">/</span>}
					</li>
				))}
			</ol>
		</nav>
	)
}


