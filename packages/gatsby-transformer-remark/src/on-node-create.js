const grayMatter = require(`gray-matter`)
const crypto = require(`crypto`)
const _ = require(`lodash`)

module.exports = async function onCreateNode({
  node,
  getNode,
  loadNodeContent,
  boundActionCreators,
}) {
  const { createNode, createParentChildLink } = boundActionCreators

  // We only care about markdown content.
  if (
    node.internal.mediaType !== `text/markdown` &&
    node.internal.mediaType !== `text/x-markdown`
  ) {
    return
  }

  const content = await loadNodeContent(node)
  let data = grayMatter(content)

  // Convert date objects to string. Otherwise there's type mismatches
  // during inference as some dates are strings and others date objects.
  if (data.data) {
    data.data = _.mapValues(data.data, v => {
      if (_.isDate(v)) {
        return v.toString()
      } else {
        return v
      }
    })
  }

  const contentDigest = crypto
    .createHash(`md5`)
    .update(JSON.stringify(data))
    .digest(`hex`)
  const markdownNode = {
    id: `${node.id} >>> MarkdownRemark`,
    children: [],
    parent: node.id,
    internal: {
      content,
      contentDigest,
      type: `MarkdownRemark`,
    },
  }
  markdownNode.frontmatter = {
    title: ``, // always include a title
    ...data.data,
    parent: node.id,
  }

  // Add path to the markdown file path
  if (node.internal.type === `File`) {
    markdownNode.fileAbsolutePath = node.absolutePath
  }

  createNode(markdownNode)
  createParentChildLink({ parent: node, child: markdownNode })
}
