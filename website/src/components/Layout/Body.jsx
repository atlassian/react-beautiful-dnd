import React from 'react'
import styled from 'styled-components'

import PostListing from '../PostListing/PostListing'

const Container = styled.div`
  padding: ${props => props.theme.sitePadding};
`

class Body extends React.Component {
  render() {
    return(
      <Container>
        <h1>Body</h1>
        <PostListing postEdges = />
      </Container>
    )
  }
}

export default Body