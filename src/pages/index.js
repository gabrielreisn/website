import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <h1>Hi people, Gabriel here 👋</h1>
    <p>This is my work in progress webpage</p>
    <div style={{ maxWidth: `430px`, marginBottom: `1.45rem` }}>
      {/* <Image /> */}
      <img src='https://media.giphy.com/media/l2qJnXbUzQAeY/giphy.gif' atl="monkey gif - work in progress"/>
    </div>
  </Layout>
)

export default IndexPage
